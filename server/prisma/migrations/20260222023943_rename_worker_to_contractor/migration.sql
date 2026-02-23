/*
  Warnings:

  - You are about to drop the column `workerId` on the `MoneyTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `workerId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `workerId` on the `StarsTransaction` table. All the data in the column will be lost.
  - Added the required column `contractorId` to the `MoneyTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractorId` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractorId` to the `StarsTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MoneyTransaction" DROP CONSTRAINT "MoneyTransaction_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_workerId_fkey";

-- DropForeignKey
ALTER TABLE "StarsTransaction" DROP CONSTRAINT "StarsTransaction_workerId_fkey";

-- DropIndex
DROP INDEX "MoneyTransaction_workerId_idx";

-- DropIndex
DROP INDEX "Purchase_workerId_idx";

-- DropIndex
DROP INDEX "StarsTransaction_workerId_idx";

-- AlterTable
ALTER TABLE "MoneyTransaction" DROP COLUMN "workerId",
ADD COLUMN     "contractorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "workerId",
ADD COLUMN     "contractorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StarsTransaction" DROP COLUMN "workerId",
ADD COLUMN     "contractorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MoneyTransaction_contractorId_idx" ON "MoneyTransaction"("contractorId");

-- CreateIndex
CREATE INDEX "Purchase_contractorId_idx" ON "Purchase"("contractorId");

-- CreateIndex
CREATE INDEX "StarsTransaction_contractorId_idx" ON "StarsTransaction"("contractorId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarsTransaction" ADD CONSTRAINT "StarsTransaction_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
