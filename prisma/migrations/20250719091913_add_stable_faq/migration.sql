-- CreateTable
CREATE TABLE "stable_faqs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "stableId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stable_faqs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stable_faqs" ADD CONSTRAINT "stable_faqs_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "stables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
