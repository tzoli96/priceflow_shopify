-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('PRODUCT', 'COLLECTION', 'VENDOR', 'TAG', 'GLOBAL');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('NUMBER', 'TEXT', 'SELECT', 'RADIO', 'CHECKBOX', 'TEXTAREA', 'FILE');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricingFormula" TEXT NOT NULL,
    "pricingMeta" JSONB,
    "scopeType" "ScopeType" NOT NULL DEFAULT 'GLOBAL',
    "scopeValues" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "helpContent" JSONB,
    "validation" JSONB,
    "options" JSONB,
    "conditionalRules" JSONB,
    "useInFormula" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "inputs" JSONB NOT NULL,
    "result" DECIMAL(10,2) NOT NULL,
    "breakdown" JSONB,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "sessionId" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_shopId_idx" ON "Template"("shopId");

-- CreateIndex
CREATE INDEX "Template_shopId_isActive_idx" ON "Template"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "TemplateField_templateId_idx" ON "TemplateField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateField_templateId_key_key" ON "TemplateField"("templateId", "key");

-- CreateIndex
CREATE INDEX "Assignment_shopId_idx" ON "Assignment"("shopId");

-- CreateIndex
CREATE INDEX "Assignment_templateId_idx" ON "Assignment"("templateId");

-- CreateIndex
CREATE INDEX "Assignment_shopId_isActive_idx" ON "Assignment"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "Calculation_shopId_idx" ON "Calculation"("shopId");

-- CreateIndex
CREATE INDEX "Calculation_templateId_idx" ON "Calculation"("templateId");

-- CreateIndex
CREATE INDEX "Calculation_productId_idx" ON "Calculation"("productId");

-- CreateIndex
CREATE INDEX "Calculation_calculatedAt_idx" ON "Calculation"("calculatedAt");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
