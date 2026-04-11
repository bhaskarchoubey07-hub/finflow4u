-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auto_repay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kyc_doc_url" TEXT,
ADD COLUMN     "kyc_status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "lender_preferences" (
    "id" TEXT NOT NULL,
    "lender_id" TEXT NOT NULL,
    "risk_grades" TEXT[],
    "min_return" DECIMAL(5,2) NOT NULL,
    "max_duration" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lender_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lender_preferences_lender_id_key" ON "lender_preferences"("lender_id");

-- AddForeignKey
ALTER TABLE "lender_preferences" ADD CONSTRAINT "lender_preferences_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
