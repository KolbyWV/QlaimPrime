-- CreateEnum
CREATE TYPE "MembershipRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "CompanyMembershipRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "requestedRole" "CompanyRole" NOT NULL DEFAULT 'APPROVER',
    "note" TEXT,
    "status" "MembershipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMembershipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMembershipRequest_companyId_userId_key" ON "CompanyMembershipRequest"("companyId", "userId");

-- CreateIndex
CREATE INDEX "CompanyMembershipRequest_companyId_status_createdAt_idx" ON "CompanyMembershipRequest"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyMembershipRequest_userId_status_createdAt_idx" ON "CompanyMembershipRequest"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyMembershipRequest_resolvedByUserId_idx" ON "CompanyMembershipRequest"("resolvedByUserId");

-- AddForeignKey
ALTER TABLE "CompanyMembershipRequest" ADD CONSTRAINT "CompanyMembershipRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembershipRequest" ADD CONSTRAINT "CompanyMembershipRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembershipRequest" ADD CONSTRAINT "CompanyMembershipRequest_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
