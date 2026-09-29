import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./categories.controller";
import { createCategorySchema, updateCategorySchema } from "./categories.schema";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.list));
router.post("/", validate(createCategorySchema), asyncHandler(controller.create));
router.patch("/:id", validate(updateCategorySchema), asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

export default router;
