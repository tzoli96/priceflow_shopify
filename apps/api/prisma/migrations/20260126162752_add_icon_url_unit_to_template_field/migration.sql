-- AlterEnum
ALTER TYPE "FieldType" ADD VALUE 'GRAPHIC_SELECT';

-- AlterTable
ALTER TABLE "TemplateField" ADD COLUMN     "iconUrl" TEXT,
ADD COLUMN     "unit" TEXT;
