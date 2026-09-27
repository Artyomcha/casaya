-- Позиция объекта на карте: вместо процентов из макета — настоящие координаты.
-- Проценты были привязаны к конкретной картинке и вне её не значат ничего,
-- поэтому переносить их не нужно: демо-данные пересеиваются, объекты из
-- фидов получают координаты из выгрузки при ближайшей синхронизации.
ALTER TABLE "Listing" DROP COLUMN "mapX";
ALTER TABLE "Listing" DROP COLUMN "mapY";
ALTER TABLE "Listing" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN "lng" DOUBLE PRECISION;

CREATE INDEX "Listing_lat_lng_idx" ON "Listing"("lat", "lng");
