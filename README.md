# Controle Financeiro — API

Backend do projeto Controle Financeiro: Node.js + Express + TypeScript + Prisma + PostgreSQL, com autenticação via JWT (access token curto + refresh token rotativo em cookie httpOnly).

Substitui a versão anterior do projeto, que usava o Supabase como backend "as a service". Aqui a autenticação, as regras de acesso (cada usuário só enxerga seus próprios dados) e a persistência são implementadas do zero.

## Stack

- Express 4 + TypeScript
- Prisma ORM + PostgreSQL
- Zod para validação de entrada
- bcrypt para hash de senha, JWT (access + refresh) para autenticação
- helmet, cors, express-rate-limit para segurança básica
- Jest + Supertest para testes de integração

## Rodando localmente

### 1. Suba o PostgreSQL

Com Docker:

```bash
docker compose up -d postgres
```

Sem Docker: use um PostgreSQL local e ajuste `DATABASE_URL` no `.env`.

### 2. Configure o ambiente

```bash
cp .env.example .env
# edite os segredos de JWT em .env
```

### 3. Instale as dependências e rode as migrations

```bash
npm install
npm run prisma:migrate
npm run seed   # opcional: cria um usuário demo com dados de exemplo
```

Login de demonstração criado pelo seed: `demo@controlefinanceiro.com` / `demo1234`.

### 4. Suba a API

```bash
npm run dev
```

A API sobe em `http://localhost:4000`, com as rotas sob `/api/v1`.

## Rodando com Docker (API + banco)

```bash
docker compose up --build
```

## Testes

Os testes de integração rodam contra um banco Postgres de verdade (recomenda-se um banco separado do de desenvolvimento). Configure `DATABASE_URL` apontando para ele e rode:

```bash
npx prisma migrate deploy
npm test
```

## Endpoints

Prefixo: `/api/v1`

| Método | Rota | Descrição | Autenticado |
|---|---|---|---|
| POST | `/auth/register` | Cria conta (e categorias padrão) | não |
| POST | `/auth/login` | Autentica | não |
| POST | `/auth/refresh` | Renova o access token via cookie de refresh | não (usa cookie) |
| POST | `/auth/logout` | Revoga o refresh token atual | não (usa cookie) |
| GET | `/auth/me` | Dados do usuário logado | sim |
| GET/POST | `/categories` | Lista/cria categorias | sim |
| PATCH/DELETE | `/categories/:id` | Atualiza/remove categoria | sim |
| GET/POST | `/transactions` | Lista (paginado, com filtros) / cria transação | sim |
| GET/PATCH/DELETE | `/transactions/:id` | Detalhe/atualiza/remove transação | sim |
| GET | `/transactions/summary` | Totais de entrada/saída/saldo num período | sim |
| GET | `/transactions/report` | Relatório agrupado por categoria x mês | sim |

Autenticação: enviar `Authorization: Bearer <accessToken>`. O refresh token é gerenciado automaticamente via cookie httpOnly (`refreshToken`, escopo `/api/v1/auth`); o cliente HTTP precisa enviar requisições com `credentials: "include"`.
