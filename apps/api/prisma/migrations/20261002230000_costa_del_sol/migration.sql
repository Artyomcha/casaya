-- Регион портала сменился с Коста-Бланки на Коста-дель-Соль:
-- объект без указанного города теперь попадает в Марбелью, а не в Аликанте.
ALTER TABLE "Property" ALTER COLUMN "city" SET DEFAULT 'Marbella';
ALTER TABLE "Listing" ALTER COLUMN "city" SET DEFAULT 'Марбелья';
