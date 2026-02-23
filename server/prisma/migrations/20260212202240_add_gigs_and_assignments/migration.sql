-- CreateEnum
CREATE TYPE "GigStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'DECLINED', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "payCents" INTEGER,
    "status" "GigStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigAssignment" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "note" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gig_companyId_status_idx" ON "Gig"("companyId", "status");

-- CreateIndex
CREATE INDEX "Gig_createdByUserId_idx" ON "Gig"("createdByUserId");

-- CreateIndex
CREATE INDEX "GigAssignment_gigId_idx" ON "GigAssignment"("gigId");

-- CreateIndex
CREATE INDEX "GigAssignment_userId_idx" ON "GigAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GigAssignment_gigId_userId_key" ON "GigAssignment"("gigId", "userId");

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigAssignment" ADD CONSTRAINT "GigAssignment_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigAssignment" ADD CONSTRAINT "GigAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
