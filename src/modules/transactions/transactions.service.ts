import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ForbiddenException, NotFoundException } from "../../exceptions/http-exception";
import { assertCategoryBelongsToUser } from "../categories/categories.service";
import { CreateTransactionInput, ListTransactionsQuery, ReportQuery, UpdateTransactionInput } from "./transactions.schema";

const endOfDay = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const dateRangeFilter = (startDate?: Date, endDate?: Date) => {
  if (!startDate && !endDate) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (startDate) filter.gte = startDate;
  if (endDate) filter.lte = endOfDay(endDate);
  return filter;
};

/**
 * decimal.js (o tipo Decimal do Prisma) formata `150.50` como `"150.5"` por
 * padrão — trocamos por `toFixed(2)` pra manter sempre 2 casas na API, sem
 * perder precisão convertendo pra `number` no caminho.
 */
const serializeTransaction = <T extends { amount: Prisma.Decimal }>(transaction: T) => ({
  ...transaction,
  amount: transaction.amount.toFixed(2),
});

export const listTransactions = async (userId: string, query: ListTransactionsQuery) => {
  const where: Prisma.TransactionWhereInput = {
    userId,
    type: query.type,
    categoryId: query.categoryId,
    date: dateRangeFilter(query.startDate, query.endDate),
  };

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: data.map(serializeTransaction),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
};

const findOwnedTransactionOrThrow = async (userId: string, id: string) => {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    throw new NotFoundException("Transação não encontrada");
  }
  if (transaction.userId !== userId) {
    throw new ForbiddenException("Você não tem acesso a essa transação");
  }
  return transaction;
};

export const getTransaction = async (userId: string, id: string) => {
  await findOwnedTransactionOrThrow(userId, id);
  const transaction = await prisma.transaction.findUnique({ where: { id }, include: { category: true } });
  return transaction ? serializeTransaction(transaction) : null;
};

export const createTransaction = async (userId: string, input: CreateTransactionInput) => {
  if (input.categoryId) {
    await assertCategoryBelongsToUser(userId, input.categoryId, input.type);
  }

  const transaction = await prisma.transaction.create({
    data: {
      description: input.description,
      amount: input.amount.toFixed(2),
      type: input.type,
      date: input.date,
      categoryId: input.categoryId,
      userId,
    },
    include: { category: true },
  });
  return serializeTransaction(transaction);
};

export const updateTransaction = async (userId: string, id: string, input: UpdateTransactionInput) => {
  const existing = await findOwnedTransactionOrThrow(userId, id);

  const nextType = input.type ?? existing.type;
  if (input.categoryId) {
    await assertCategoryBelongsToUser(userId, input.categoryId, nextType);
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      description: input.description,
      amount: input.amount !== undefined ? input.amount.toFixed(2) : undefined,
      type: input.type,
      date: input.date,
      categoryId: input.categoryId,
    },
    include: { category: true },
  });
  return serializeTransaction(transaction);
};

export const deleteTransaction = async (userId: string, id: string) => {
  await findOwnedTransactionOrThrow(userId, id);
  await prisma.transaction.delete({ where: { id } });
};

export const getSummary = async (userId: string, range: { startDate?: Date; endDate?: Date }) => {
  const baseWhere: Prisma.TransactionWhereInput = {
    userId,
    date: dateRangeFilter(range.startDate, range.endDate),
  };

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: baseWhere,
    _sum: { amount: true },
  });

  const income = Number(totals.find((t) => t.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(totals.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0);

  return {
    income,
    expense,
    balance: Number((income - expense).toFixed(2)),
  };
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const getReport = async (userId: string, query: ReportQuery) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: query.type,
      date: dateRangeFilter(query.startDate, query.endDate),
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const monthsSet = new Set<string>();
  const byCategory = new Map<
    string,
    { categoryId: string | null; categoryName: string; type: TransactionType; months: Map<string, number> }
  >();

  for (const tx of transactions) {
    const key = monthKey(tx.date);
    monthsSet.add(key);

    const categoryId = tx.categoryId;
    const categoryName = tx.category?.name ?? "Sem categoria";
    const mapKey = `${categoryId ?? "none"}:${tx.type}`;

    if (!byCategory.has(mapKey)) {
      byCategory.set(mapKey, { categoryId, categoryName, type: tx.type, months: new Map() });
    }
    const entry = byCategory.get(mapKey)!;
    entry.months.set(key, (entry.months.get(key) ?? 0) + Number(tx.amount));
  }

  const months = Array.from(monthsSet).sort();

  const categories = Array.from(byCategory.values()).map((entry) => {
    const monthsRecord: Record<string, number> = {};
    let total = 0;
    for (const key of months) {
      const value = Number((entry.months.get(key) ?? 0).toFixed(2));
      monthsRecord[key] = value;
      total += value;
    }
    return {
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      type: entry.type,
      months: monthsRecord,
      total: Number(total.toFixed(2)),
    };
  });

  const monthlyTotals: Record<string, number> = {};
  for (const key of months) {
    monthlyTotals[key] = Number(
      categories.reduce((sum, category) => sum + (category.months[key] ?? 0), 0).toFixed(2)
    );
  }

  return {
    months,
    categories,
    monthlyTotals,
    grandTotal: Number(categories.reduce((sum, category) => sum + category.total, 0).toFixed(2)),
  };
};
