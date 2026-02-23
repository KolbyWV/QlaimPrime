/*
  Warnings:

  - You are about to drop the column `bonusStars` on the `Gig` table. All the data in the column will be lost.
  - You are about to drop the column `currentPriceCents` on the `Gig` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `GigAssignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gig" DROP COLUMN "bonusStars",
DROP COLUMN "currentPriceCents";

-- AlterTable
ALTER TABLE "GigAssignment" DROP COLUMN "notes";

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
