-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('FEATURE', 'BUG', 'IMPROVEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SuggestionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "suggestions" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'user-feedback',
ADD COLUMN     "priority" "SuggestionPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "type" "SuggestionType" NOT NULL DEFAULT 'FEATURE';
