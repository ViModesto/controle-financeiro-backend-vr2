import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { authRateLimiter } from "../../middlewares/rateLimiter";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/refresh", asyncHandler(controller.refresh));
router.post("/logout", asyncHandler(controller.logout));
router.get("/me", requireAuth, asyncHandler(controller.me));

export default router;
