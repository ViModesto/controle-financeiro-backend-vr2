import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { registerUser, resetDatabase, uniqueEmail } from "./helpers";

const app = createApp();

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/register", () => {
  it("cria o usuário, categorias padrão e retorna os tokens", async () => {
    const response = await registerUser(app);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: "Usuário Teste" });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]?.[0]).toMatch(/refreshToken=/);

    const categories = await prisma.category.count({ where: { userId: response.body.user.id } });
    expect(categories).toBeGreaterThan(0);
  });

  it("rejeita e-mail duplicado com 409", async () => {
    const email = uniqueEmail();
    await registerUser(app, { email });

    const response = await registerUser(app, { email });

    expect(response.status).toBe(409);
  });

  it("rejeita senha curta com 422", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Fulano", email: uniqueEmail(), password: "123" });

    expect(response.status).toBe(422);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("autentica com credenciais corretas", async () => {
    const email = uniqueEmail();
    const password = "senha12345";
    await registerUser(app, { email, password });

    const response = await request(app).post("/api/v1/auth/login").send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it("rejeita senha incorreta com 401", async () => {
    const email = uniqueEmail();
    await registerUser(app, { email, password: "senha12345" });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "senha-errada" });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("retorna 401 sem token", async () => {
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
  });

  it("retorna o usuário autenticado com token válido", async () => {
    const register = await registerUser(app);
    const token = register.body.accessToken;

    const response = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(register.body.user.email);
  });
});
