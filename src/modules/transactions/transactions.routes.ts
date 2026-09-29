import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./transactions.controller";
import {
  createTransactionSchema,
  dateRangeQuerySchema,
  listTransactionsQuerySchema,
  reportQuerySchema,
  updateTransactionSchema,
} from "./transactions.schema";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listTransactionsQuerySchema, "query"), asyncHandler(controller.list));
router.get("/summary", validate(dateRangeQuerySchema, "query"), asyncHandler(controller.summary));
router.get("/report", validate(reportQuerySchema, "query"), asyncHandler(controller.report));
router.get("/:id", asyncHandler(controller.getById));
router.post("/", validate(createTransactionSchema), asyncHandler(controller.create));
router.patch("/:id", validate(updateTransactionSchema), asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

export default router;
