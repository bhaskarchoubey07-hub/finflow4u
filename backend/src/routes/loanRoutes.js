const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { applyForLoan, marketplace, myLoans } = require("../controllers/loanController");

const router = express.Router();

const loanApplicationSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    purpose: z.string().min(3).max(120),
    termMonths: z.coerce.number().int().min(3).max(60),
    annualIncome: z.coerce.number().positive(),
    existingDebt: z.coerce.number().min(0),
    employmentStatus: z.string().min(2).max(60)
  })
});

/**
 * @swagger
 * /loan/apply:
 *   post:
 *     summary: Apply for a loan
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/apply",
  authenticate,
  authorize("BORROWER"),
  validate(loanApplicationSchema),
  asyncHandler(applyForLoan)
);

/**
 * @swagger
 * /loan/marketplace:
 *   get:
 *     summary: List active marketplace loan opportunities
 */
router.get("/marketplace", asyncHandler(marketplace));

/**
 * @swagger
 * /loan/my-loans:
 *   get:
 *     summary: List loans for the current borrower
 *     security:
 *       - bearerAuth: []
 */
router.get("/my-loans", authenticate, authorize("BORROWER"), asyncHandler(myLoans));

module.exports = router;
