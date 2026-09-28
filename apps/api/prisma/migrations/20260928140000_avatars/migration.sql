-- Логотип агентства и аватар частного продавца: узнаваемость в выдаче
-- важнее, чем квадрат с инициалами.
ALTER TABLE "Agency" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
