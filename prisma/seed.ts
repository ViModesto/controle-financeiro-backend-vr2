import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { DEFAULT_CATEGORIES } from "../src/modules/categories/categories.service";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@controlefinanceiro.com";
  const password = "demo1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Usuário demo já existe, pulando seed.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Usuário Demo",
      email,
      passwordHash: await hashPassword(password),
    },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: user.id })),
  });

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const findCategory = (name: string) => categories.find((c) => c.name === name)!.id;

  const today = new Date();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

  await prisma.transaction.createMany({
    data: [
      {
        description: "Salário de setembro",
        amount: "5200.00",
        type: "INCOME",
        date: daysAgo(20),
        categoryId: findCategory("Salário"),
        userId: user.id,
      },
      {
        description: "Projeto freelance",
        amount: "800.00",
        type: "INCOME",
        date: daysAgo(10),
        categoryId: findCategory("Freelance"),
        userId: user.id,
      },
      {
        description: "Supermercado",
        amount: "430.50",
        type: "EXPENSE",
        date: daysAgo(15),
        categoryId: findCategory("Alimentação"),
        userId: user.id,
      },
      {
        description: "Aluguel",
        amount: "1200.00",
        type: "EXPENSE",
        date: daysAgo(18),
        categoryId: findCategory("Moradia"),
        userId: user.id,
      },
      {
        description: "Uber",
        amount: "95.30",
        type: "EXPENSE",
        date: daysAgo(5),
        categoryId: findCategory("Transporte"),
        userId: user.id,
      },
    ],
  });

  console.log(`Seed concluído. Login demo: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
