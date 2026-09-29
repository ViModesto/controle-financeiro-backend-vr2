import dotenv from "dotenv";

dotenv.config();

// Os testes de integração rodam contra um banco de verdade (use uma
// DATABASE_URL separada da de desenvolvimento, ex.: "controle_financeiro_test").
// Antes de rodar `npm test`, garanta que as migrations foram aplicadas nesse banco:
//   npx prisma migrate deploy
