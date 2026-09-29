import { Prisma, PrismaClient, TransactionType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ConflictException, ForbiddenException, NotFoundException } from "../../exceptions/http-exception";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

/** Categorias criadas automaticamente para todo usuário novo. */
export const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  { name: "Salário", type: "INCOME", color: "#22C55E" },
  { name: "Freelance", type: "INCOME", color: "#0EA5E9" },
  { name: "Outras receitas", type: "INCOME", color: "#14B8A6" },
  { name: "Alimentação", type: "EXPENSE", color: "#F97316" },
  { name: "Transporte", type: "EXPENSE", color: "#EAB308" },
  { name: "Moradia", type: "EXPENSE", color: "#8B5CF6" },
  { name: "Saúde", type: "EXPENSE", color: "#EF4444" },
  { name: "Lazer", type: "EXPENSE", color: "#EC4899" },
  { name: "Outras despesas", type: "EXPENSE", color: "#64748B" },
];

export const createDefaultCategories = (userId: string, client: PrismaClient | Prisma.TransactionClient = prisma) =>
  client.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId })),
  });

export const listCategories = (userId: string) =>
  prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

export const createCategory = async (userId: string, input: CreateCategoryInput) => {
  const existing = await prisma.category.findFirst({
    where: { userId, name: input.name, type: input.type },
  });
  if (existing) {
    throw new ConflictException("Já existe uma categoria com esse nome e tipo");
  }

  return prisma.category.create({ data: { ...input, userId } });
};

const findOwnedCategoryOrThrow = async (userId: string, categoryId: string) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new NotFoundException("Categoria não encontrada");
  }
  if (category.userId !== userId) {
    throw new ForbiddenException("Você não tem acesso a essa categoria");
  }
  return category;
};

export const updateCategory = async (userId: string, categoryId: string, input: UpdateCategoryInput) => {
  await findOwnedCategoryOrThrow(userId, categoryId);
  return prisma.category.update({ where: { id: categoryId }, data: input });
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  await findOwnedCategoryOrThrow(userId, categoryId);
  await prisma.category.delete({ where: { id: categoryId } });
};

export const assertCategoryBelongsToUser = async (
  userId: string,
  categoryId: string,
  expectedType: TransactionType
) => {
  const category = await findOwnedCategoryOrThrow(userId, categoryId);
  if (category.type !== expectedType) {
    throw new ConflictException(
      `A categoria "${category.name}" é do tipo ${category.type}, incompatível com o lançamento`
    );
  }
};
