import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { ErrorCode, HttpException, InternalException } from "../exceptions/http-exception";

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    errorCode: ErrorCode.NOT_FOUND,
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const exception = normalizeError(error);

  if (exception.statusCode >= 500) {
    console.error(`[erro] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(exception.statusCode).json({
    message: exception.message,
    errorCode: exception.errorCode,
    details: exception.details,
  });
};

function normalizeError(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new HttpException("Registro já existe (violação de chave única)", 409, ErrorCode.CONFLICT, {
      target: error.meta?.target,
    });
  }

  const message = env.isProduction
    ? "Erro interno do servidor"
    : error instanceof Error
      ? error.message
      : "Erro desconhecido";

  return new InternalException(message);
}
