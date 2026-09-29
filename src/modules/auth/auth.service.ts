import { prisma } from "../../config/prisma";
import { ConflictException, NotFoundException, UnauthorizedException } from "../../exceptions/http-exception";
import { comparePassword, hashPassword } from "../../utils/password";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
} from "../../utils/jwt";
import { createDefaultCategories } from "../categories/categories.service";
import { LoginInput, RegisterInput } from "./auth.schema";

const publicUser = (user: { id: string; name: string; email: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const issueTokenPair = async (user: { id: string; email: string }) => {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictException("Já existe uma conta com esse e-mail");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });
    await createDefaultCategories(created.id, tx);
    return created;
  });

  const tokens = await issueTokenPair(user);
  return { user: publicUser(user), ...tokens };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedException("E-mail ou senha incorretos");
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedException("E-mail ou senha incorretos");
  }

  const tokens = await issueTokenPair(user);
  return { user: publicUser(user), ...tokens };
};

/**
 * Rotaciona o refresh token: o token recebido é revogado e um novo par é
 * emitido. Isso limita o estrago se um refresh token vazar, já que ele só
 * funciona uma vez.
 */
export const refresh = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedException("Sessão expirada, faça login novamente");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(stored.user);
  return { user: publicUser(stored.user), ...tokens };
};

export const logout = async (refreshToken: string | undefined) => {
  if (!refreshToken) return;
  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException("Usuário não encontrado");
  }
  return publicUser(user);
};
