import { z } from "zod";
import { categoryTypeSchema } from "../categories/categories.schema";

/** Trata `""`/ausente como "não informado" antes de tentar converter em Date. */
const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : value),
  z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), "Data inválida")
).optional();

export const createTransactionSchema = z.object({
  description: z.string().trim().min(1, "Informe uma descrição").max(140),
  amount: z.coerce.number().finite().positive("O valor deve ser positivo"),
  type: categoryTypeSchema,
  date: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), "Data inválida"),
  categoryId: z.string().cuid().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z.object({
  startDate: optionalDate,
  endDate: optionalDate,
  type: categoryTypeSchema.optional(),
  categoryId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeQuerySchema = z.object({
  startDate: optionalDate,
  endDate: optionalDate,
});

export const reportQuerySchema = dateRangeQuerySchema.extend({
  type: categoryTypeSchema.optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
