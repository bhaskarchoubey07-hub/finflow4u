const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { register, login, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    role: z.enum(["BORROWER", "LENDER"])
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new borrower or lender
 */
router.post("/register", validate(registerSchema), asyncHandler(register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 */
router.post("/login", validate(loginSchema), asyncHandler(login));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", authenticate, asyncHandler(me));

module.exports = router;
