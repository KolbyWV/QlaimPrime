-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('MEMBERSHIP_UPGRADE', 'PAY_BONUS');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "tier" "MembershipTier",
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "starsCost" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "effectPct" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "appliedToAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_workerId_idx" ON "Purchase"("workerId");

-- CreateIndex
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");

-- CreateIndex
CREATE INDEX "Purchase_appliedToAssignmentId_idx" ON "Purchase"("appliedToAssignmentId");

-- CreateIndex
CREATE INDEX "StarsTransaction_purchaseId_idx" ON "StarsTransaction"("purchaseId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_appliedToAssignmentId_fkey" FOREIGN KEY ("appliedToAssignmentId") REFERENCES "GigAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarsTransaction" ADD CONSTRAINT "StarsTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
