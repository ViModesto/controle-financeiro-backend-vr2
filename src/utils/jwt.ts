import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl as jwt.SignOptions["expiresIn"] });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;

/**
 * O refresh token em si é só um identificador opaco e aleatório (não um JWT
 * assinado): o que autoriza a renovação é ele bater com o hash guardado no
 * banco para aquele usuário, o que permite revogar/rotacionar sob demanda.
 */
export const generateRefreshToken = (): string => crypto.randomBytes(64).toString("hex");

export const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshTokenExpiryDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + env.refreshTokenTtlDays);
  return date;
};
