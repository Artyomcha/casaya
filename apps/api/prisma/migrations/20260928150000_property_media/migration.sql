-- Канонические фото объекта: одну квартиру несколько агентств снимают
-- по-разному, и в общей карточке нужен свой набор, а не случайный.
ALTER TABLE "Property" ADD COLUMN "coverImage" TEXT;
ALTER TABLE "Property" ADD COLUMN "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Property" ADD COLUMN "photoSource" TEXT;
