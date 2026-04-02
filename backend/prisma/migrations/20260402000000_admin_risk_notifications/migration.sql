-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'REJECTED';

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "loan_requests"
ADD COLUMN "probability_of_default" DECIMAL(5,2),
ADD COLUMN "risk_band" TEXT,
ADD COLUMN "decision_reason" TEXT,
ADD COLUMN "recommended_rate" DECIMAL(5,2),
ADD COLUMN "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewed_by" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(3),
ADD COLUMN "review_notes" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
