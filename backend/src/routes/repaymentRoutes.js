const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { payRepayment } = require("../controllers/repaymentController");

const router = express.Router();

const repaymentSchema = z.object({
  body: z.object({
    loanId: z.string().min(5),
    amountPaid: z.coerce.number().positive()
  })
});

/**
 * @swagger
 * /repayment/pay:
 *   post:
 *     summary: Pay the next due repayment for a loan
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/pay",
  authenticate,
  authorize("BORROWER"),
  validate(repaymentSchema),
  asyncHandler(payRepayment)
);

module.exports = router;
