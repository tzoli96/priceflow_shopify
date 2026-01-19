-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "discountTiers" JSONB,
ADD COLUMN     "expressLabel" TEXT,
ADD COLUMN     "expressMultiplier" DECIMAL(4,2),
ADD COLUMN     "hasExpressOption" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxQuantity" INTEGER,
ADD COLUMN     "maxQuantityMessage" TEXT,
ADD COLUMN     "minQuantity" INTEGER,
ADD COLUMN     "minQuantityMessage" TEXT,
ADD COLUMN     "normalLabel" TEXT;
