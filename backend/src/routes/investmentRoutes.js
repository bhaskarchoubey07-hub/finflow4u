const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { createInvestment } = require("../controllers/investmentController");

const router = express.Router();

const investmentSchema = z.object({
  body: z.object({
    loanId: z.string().min(5),
    amountInvested: z.coerce.number().positive()
  })
});

/**
 * @swagger
 * /invest:
 *   post:
 *     summary: Invest in a loan listing
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  authorize("LENDER"),
  validate(investmentSchema),
  asyncHandler(createInvestment)
);

module.exports = router;
