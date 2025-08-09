-- AlterTable
ALTER TABLE "public"."invoice_requests" ADD COLUMN     "favoriteStables" TEXT[] DEFAULT ARRAY[]::TEXT[];
