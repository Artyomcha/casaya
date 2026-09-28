-- Реальный объект отдельно от предложений агентств: одну квартиру продают
-- несколько агентств, и на витрине это должна быть одна карточка.
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cadastralRef" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Alicante',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "kind" "PropertyKind" NOT NULL,
    "area" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "floor" INTEGER,
    "seaView" BOOLEAN NOT NULL DEFAULT false,
    "yearBuilt" INTEGER,
    "matchKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
CREATE UNIQUE INDEX "Property_cadastralRef_key" ON "Property"("cadastralRef");
CREATE INDEX "Property_matchKey_idx" ON "Property"("matchKey");
CREATE INDEX "Property_lat_lng_idx" ON "Property"("lat", "lng");

ALTER TABLE "Listing" ADD COLUMN "propertyId" TEXT;
CREATE INDEX "Listing_propertyId_price_idx" ON "Listing"("propertyId", "price");

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
