-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "embedding" vector(768),
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "salary" SET DATA TYPE TEXT;
