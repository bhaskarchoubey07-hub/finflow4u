const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { pendingReviews, reviewLoan, adminAnalytics } = require("../controllers/loanController");

const router = express.Router();

const reviewLoanSchema = z.object({
  params: z.object({
    loanId: z.string().min(5)
  }),
  body: z.object({
    reviewStatus: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
    reviewNotes: z.string().min(5).max(500)
  })
});

router.use(authenticate, authorize("ADMIN"));

router.get("/loans/pending", asyncHandler(pendingReviews));
router.get("/analytics", asyncHandler(adminAnalytics));
router.patch("/loan/:loanId/review", validate(reviewLoanSchema), asyncHandler(reviewLoan));

module.exports = router;
