-- Контур дома из испанского кадастра: геометрия и этажность для 3D-вида.
ALTER TABLE "Property" ADD COLUMN "footprint" JSONB;
ALTER TABLE "Property" ADD COLUMN "footprintAt" TIMESTAMP(3);
