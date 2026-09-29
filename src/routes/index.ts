import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import transactionsRoutes from "../modules/transactions/transactions.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));
router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/transactions", transactionsRoutes);

export default router;
