import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationException } from "../exceptions/http-exception";

type Source = "body" | "query" | "params";

/**
 * Valida `req[source]` contra um schema zod e substitui `req[source]` pelo
 * resultado já parseado (com coerções/defaults aplicados), para os
 * controllers não precisarem repetir validação nenhuma.
 */
export const validate = (schema: AnyZodObject, source: Source = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationException(error.flatten()));
      }
      next(error);
    }
  };
};
