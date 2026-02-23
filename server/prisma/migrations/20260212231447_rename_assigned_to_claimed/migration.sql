/*
  Warnings:

  - The values [ASSIGNED] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ASSIGNED] on the enum `GigStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "GigType" AS ENUM ('STANDARD', 'DELIVERY', 'AUDIT');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('CLAIMED', 'ACCEPTED', 'DECLINED', 'STARTED', 'SUBMITTED', 'REVIEWED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."GigAssignment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "GigAssignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "public"."AssignmentStatus_old";
ALTER TABLE "GigAssignment" ALTER COLUMN "status" SET DEFAULT 'CLAIMED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GigStatus_new" AS ENUM ('DRAFT', 'OPEN', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Gig" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Gig" ALTER COLUMN "status" TYPE "GigStatus_new" USING ("status"::text::"GigStatus_new");
ALTER TYPE "GigStatus" RENAME TO "GigStatus_old";
ALTER TYPE "GigStatus_new" RENAME TO "GigStatus";
DROP TYPE "public"."GigStatus_old";
ALTER TABLE "Gig" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Gig" ADD COLUMN     "basePriceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonusStars" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentPriceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "escalationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastEscalatedAt" TIMESTAMP(3),
ADD COLUMN     "repostCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredTier" "MembershipTier",
ADD COLUMN     "type" "GigType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "units" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "GigAssignment" ADD COLUMN     "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endImageUrl" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "startImageUrl" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'CLAIMED';

-- CreateTable
CREATE TABLE "GigReview" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "reviewerMemberId" TEXT NOT NULL,
    "starsRating" INTEGER NOT NULL,
    "comment" TEXT,
    "decision" "ReviewDecision" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GigReview_assignmentId_key" ON "GigReview"("assignmentId");

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "GigAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_reviewerMemberId_fkey" FOREIGN KEY ("reviewerMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
