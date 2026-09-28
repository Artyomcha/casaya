-- Платное продвижение и статистика показов: без них нельзя ни продавать
-- размещение, ни объяснить агентству, за что оно платит.
CREATE TYPE "PromotionTier" AS ENUM ('NONE', 'BUMP', 'FEATURED', 'TOP_AREA');
CREATE TYPE "PromotionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "Placement" AS ENUM ('SEARCH', 'MAP', 'LISTING_CARD', 'RECOMMENDATION', 'HOME');

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tier" "PromotionTier" NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "area" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Promotion_listingId_status_idx" ON "Promotion"("listingId", "status");
CREATE INDEX "Promotion_status_endsAt_idx" ON "Promotion"("status", "endsAt");

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ListingStat" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "placement" "Placement" NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ListingStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingStat_listingId_day_placement_key" ON "ListingStat"("listingId", "day", "placement");
CREATE INDEX "ListingStat_listingId_day_idx" ON "ListingStat"("listingId", "day");

ALTER TABLE "ListingStat" ADD CONSTRAINT "ListingStat_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
