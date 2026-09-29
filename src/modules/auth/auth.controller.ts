import { Request, Response } from "express";
import { env } from "../../config/env";
import { UnauthorizedException } from "../../exceptions/http-exception";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: REFRESH_COOKIE_PATH,
  maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
});

const sendAuthResponse = (
  res: Response,
  result: { user: unknown; accessToken: string; refreshToken: string }
) => {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
  res.json({ user: result.user, accessToken: result.accessToken });
};

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201);
  sendAuthResponse(res, result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result);
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedException("Sessão não encontrada");
  }
  const result = await authService.refresh(token);
  sendAuthResponse(res, result);
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(204).send();
};

export const me = async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.json(user);
};
