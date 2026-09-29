import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envolve um controller assíncrono e repassa qualquer erro lançado (incluindo
 * rejeições de Promise) para o middleware central de erros via `next(error)`.
 * Sem isso, um `throw` dentro de um handler `async` do Express derruba a
 * conexão em silêncio em vez de virar uma resposta HTTP.
 */
export const asyncHandler = (handler: Handler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
};
