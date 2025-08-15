-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "address" TEXT,
ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipalityId" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "postalPlace" TEXT;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "public"."counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "public"."municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
