-- Add required two-photo proof arrays for assignment start and submission.
ALTER TABLE "GigAssignment"
ADD COLUMN "startImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "endImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy single-url fields when present.
UPDATE "GigAssignment"
SET "startImageUrls" = ARRAY["startImageUrl"]
WHERE "startImageUrl" IS NOT NULL AND cardinality("startImageUrls") = 0;

UPDATE "GigAssignment"
SET "endImageUrls" = ARRAY["endImageUrl"]
WHERE "endImageUrl" IS NOT NULL AND cardinality("endImageUrls") = 0;
