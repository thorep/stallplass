-- AlterTable
ALTER TABLE "public"."horses" ADD COLUMN     "stableId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."horses" ADD CONSTRAINT "horses_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "public"."stables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
