-- Рыночная цена объекта: по ней считается экономия и правило попадания в выдачу.
ALTER TABLE "Listing" ADD COLUMN "marketPrice" INTEGER;
