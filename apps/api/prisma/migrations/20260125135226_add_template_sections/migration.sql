-- AlterTable
ALTER TABLE "TemplateField" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "TemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "layoutType" TEXT NOT NULL DEFAULT 'VERTICAL',
    "columnsCount" INTEGER,
    "collapsible" BOOLEAN NOT NULL DEFAULT true,
    "defaultOpen" BOOLEAN NOT NULL DEFAULT true,
    "showNumber" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "builtInType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateSection_templateId_idx" ON "TemplateSection"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSection_templateId_key_key" ON "TemplateSection"("templateId", "key");

-- CreateIndex
CREATE INDEX "TemplateField_sectionId_idx" ON "TemplateField"("sectionId");

-- AddForeignKey
ALTER TABLE "TemplateSection" ADD CONSTRAINT "TemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TemplateSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
