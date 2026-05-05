ALTER TABLE "Job" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Job" ADD COLUMN "embedding" vector(3072);
