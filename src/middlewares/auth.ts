import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/http-exception";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Exige um access token JWT válido no header `Authorization: Bearer <token>`.
 * Em caso de sucesso, popula `req.user` e chama `next()` — diferente da
 * primeira tentativa deste backend, onde o middleware verificava o token mas
 * nunca chamava `next()` no caminho feliz, travando a requisição pra sempre.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return next(new UnauthorizedException("Token de acesso ausente"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedException("Token de acesso inválido ou expirado"));
  }
};
