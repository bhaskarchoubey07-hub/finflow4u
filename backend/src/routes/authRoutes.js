const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { register, login, me, forgotPassword, resetPassword, kycUpload, updatePreferences } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ... (schemas stay same)

/**
 * @swagger
 * /auth/kyc-upload:
 *   post:
 *     summary: Upload KYC documents
 */
router.post("/kyc-upload", authenticate, asyncHandler(kycUpload));

/**
 * @swagger
 * /auth/preferences:
 *   post:
 *     summary: Update user preferences (auto-repay)
 */
router.post("/preferences", authenticate, asyncHandler(updatePreferences));

router.post("/register", validate(registerSchema), asyncHandler(register));


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

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
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

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 */
router.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(forgotPassword));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using the emailed token
 */
router.post("/reset-password", validate(resetPasswordSchema), asyncHandler(resetPassword));

module.exports = router;
