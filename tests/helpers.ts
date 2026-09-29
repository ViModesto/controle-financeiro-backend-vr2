import request from "supertest";
import { Express } from "express";
import { prisma } from "../src/config/prisma";

/** Remove todos os dados das tabelas usadas nos testes, na ordem certa (FKs). */
export const resetDatabase = async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
};

export const uniqueEmail = () => `teste-${Date.now()}-${Math.random().toString(36).slice(2)}@exemplo.com`;

export const registerUser = (
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
) => {
  const payload = {
    name: overrides.name ?? "Usuário Teste",
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? "senha12345",
  };

  return request(app).post("/api/v1/auth/register").send(payload);
};
