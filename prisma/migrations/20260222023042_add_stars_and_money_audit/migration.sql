-- CreateEnum
CREATE TYPE "StarsReason" AS ENUM ('EARNED_FROM_REVIEW', 'SPENT_ON_PRODUCT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "MoneyReason" AS ENUM ('PAYOUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "StarsTransaction" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "StarsReason" NOT NULL,
    "gigId" TEXT,
    "assignmentId" TEXT,
    "purchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyTransaction" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" "MoneyReason" NOT NULL,
    "gigId" TEXT,
    "assignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StarsTransaction_workerId_idx" ON "StarsTransaction"("workerId");

-- CreateIndex
CREATE INDEX "StarsTransaction_gigId_idx" ON "StarsTransaction"("gigId");

-- CreateIndex
CREATE INDEX "StarsTransaction_assignmentId_idx" ON "StarsTransaction"("assignmentId");

-- CreateIndex
CREATE INDEX "MoneyTransaction_workerId_idx" ON "MoneyTransaction"("workerId");

-- CreateIndex
CREATE INDEX "MoneyTransaction_gigId_idx" ON "MoneyTransaction"("gigId");

-- CreateIndex
CREATE INDEX "MoneyTransaction_assignmentId_idx" ON "MoneyTransaction"("assignmentId");

-- AddForeignKey
ALTER TABLE "StarsTransaction" ADD CONSTRAINT "StarsTransaction_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarsTransaction" ADD CONSTRAINT "StarsTransaction_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarsTransaction" ADD CONSTRAINT "StarsTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "GigAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "GigAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
