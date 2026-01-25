-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "hasNotesField" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notesFieldLabel" TEXT,
ADD COLUMN     "notesFieldPlaceholder" TEXT;

-- AlterTable
ALTER TABLE "TemplateField" ADD COLUMN     "displayStyle" TEXT,
ADD COLUMN     "presetValues" JSONB;
