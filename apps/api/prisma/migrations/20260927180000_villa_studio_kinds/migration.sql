-- Испанский рынок различает виллу и обычный дом, студию и квартиру —
-- фильтры в приложении работают именно по этим типам.
ALTER TYPE "PropertyKind" ADD VALUE IF NOT EXISTS 'STUDIO' AFTER 'FLAT';
ALTER TYPE "PropertyKind" ADD VALUE IF NOT EXISTS 'VILLA' AFTER 'HOUSE';
