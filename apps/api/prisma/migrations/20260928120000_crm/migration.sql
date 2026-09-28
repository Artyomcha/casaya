-- CRM: воронка откликов с этапами, ответственным и историей.
-- Старые значения статуса переводим в новые: IN_PROGRESS → CONTACTED, DONE → WON.
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONTACTED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'VIEWING';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'NEGOTIATION';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'WON';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'LOST';
