import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { registerUser, resetDatabase } from "./helpers";

const app = createApp();

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

const setupUser = async () => {
  const register = await registerUser(app);
  const token = register.body.accessToken as string;
  const categories = await prisma.category.findMany({ where: { userId: register.body.user.id } });
  return { token, userId: register.body.user.id as string, categories };
};

describe("POST /api/v1/transactions", () => {
  it("cria uma transação vinculada ao usuário autenticado", async () => {
    const { token, categories } = await setupUser();
    const category = categories.find((c) => c.type === "EXPENSE")!;

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Mercado",
        amount: 150.5,
        type: "EXPENSE",
        date: new Date().toISOString(),
        categoryId: category.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.description).toBe("Mercado");
    expect(response.body.amount).toBe("150.50");
  });

  it("rejeita sem token com 401", async () => {
    const response = await request(app).post("/api/v1/transactions").send({});
    expect(response.status).toBe(401);
  });

  it("rejeita categoria de tipo incompatível com 409", async () => {
    const { token, categories } = await setupUser();
    const incomeCategory = categories.find((c) => c.type === "INCOME")!;

    const response = await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Mercado",
        amount: 100,
        type: "EXPENSE",
        date: new Date().toISOString(),
        categoryId: incomeCategory.id,
      });

    expect(response.status).toBe(409);
  });
});

describe("isolamento entre usuários", () => {
  it("um usuário não enxerga transações de outro", async () => {
    const userA = await setupUser();
    const userB = await setupUser();

    await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        description: "Transação do usuário A",
        amount: 50,
        type: "EXPENSE",
        date: new Date().toISOString(),
      });

    const responseB = await request(app)
      .get("/api/v1/transactions")
      .set("Authorization", `Bearer ${userB.token}`);

    expect(responseB.status).toBe(200);
    expect(responseB.body.data).toHaveLength(0);
  });

  it("retorna 403 ao tentar acessar transação de outro usuário", async () => {
    const userA = await setupUser();
    const userB = await setupUser();

    const created = await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        description: "Transação do usuário A",
        amount: 50,
        type: "EXPENSE",
        date: new Date().toISOString(),
      });

    const response = await request(app)
      .get(`/api/v1/transactions/${created.body.id}`)
      .set("Authorization", `Bearer ${userB.token}`);

    expect(response.status).toBe(403);
  });
});

describe("GET /api/v1/transactions/summary", () => {
  it("calcula entradas, saídas e saldo corretamente", async () => {
    const { token, categories } = await setupUser();
    const income = categories.find((c) => c.type === "INCOME")!;
    const expense = categories.find((c) => c.type === "EXPENSE")!;

    await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Salário", amount: 1000, type: "INCOME", date: new Date().toISOString(), categoryId: income.id });

    await request(app)
      .post("/api/v1/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Aluguel", amount: 400, type: "EXPENSE", date: new Date().toISOString(), categoryId: expense.id });

    const response = await request(app)
      .get("/api/v1/transactions/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ income: 1000, expense: 400, balance: 600 });
  });
});
