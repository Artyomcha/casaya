UPDATE "Lead" SET "status" = 'CONTACTED' WHERE "status" = 'IN_PROGRESS';
UPDATE "Lead" SET "status" = 'WON' WHERE "status" = 'DONE';

ALTER TABLE "Lead" ADD COLUMN "agencyId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "assigneeId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "budget" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "needsMortgage" BOOLEAN;
ALTER TABLE "Lead" ADD COLUMN "contactedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "nextStepAt" TIMESTAMP(3);

CREATE INDEX "Lead_agencyId_status_idx" ON "Lead"("agencyId", "status");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Listing" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
