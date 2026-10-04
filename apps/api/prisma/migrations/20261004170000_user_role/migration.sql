-- Роль пользователя: покупатель смотрит и отмечает, продавец размещает.
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'BUYER';
