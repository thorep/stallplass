-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterEnum
ALTER TYPE "public"."EntityType" ADD VALUE 'HORSE';

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "public"."EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL DEFAULT 'UPDATE',
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "public"."audit_logs"("entityType", "entityId", "createdAt");
