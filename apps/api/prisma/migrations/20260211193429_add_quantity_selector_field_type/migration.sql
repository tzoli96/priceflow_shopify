/*
  Warnings:

  - A unique constraint covering the columns `[templateId,sectionId,key]` on the table `TemplateField` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "FieldType" ADD VALUE 'QUANTITY_SELECTOR';

-- DropIndex
DROP INDEX "TemplateField_templateId_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "TemplateField_templateId_sectionId_key_key" ON "TemplateField"("templateId", "sectionId", "key");
