import { PrismaClient } from "@prisma/client";

// Uma única instância do Prisma Client compartilhada pela aplicação inteira,
// evitando esgotar as conexões do banco em hot-reload no dev.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
