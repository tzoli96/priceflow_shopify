import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ITemplateRepository } from './template.repository.interface';
import { TemplateModel } from '../models/template.model';
import { TemplateFieldModel } from '../models/template-field.model';

/**
 * Template Repository - Prisma Implementation
 *
 * Felelősség: Template perzisztencia Prisma ORM-mel
 *
 * Műveletek:
 * - CRUD műveletek PostgreSQL adatbázison keresztül
 * - Domain model ↔ Prisma entitás konverzió
 * - Multi-tenant shop filtering
 * - Field-ek cascade kezelése (create, update, delete)
 */
@Injectable()
export class TemplateRepository implements ITemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Template lekérése ID alapján (field-ekkel együtt)
   *
   * SQL Query:
   * SELECT * FROM templates WHERE id = ? AND shop_id = ?
   * SELECT * FROM template_fields WHERE template_id = ? ORDER BY order ASC
   */
  async findById(id: string, shopId: string): Promise<TemplateModel | null> {
    const template = await this.prisma.template.findFirst({
      where: {
        id,
        shopId, // Multi-tenant security
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    return template ? TemplateModel.fromPersistence(template) : null;
  }

  /**
   * Shop összes template-je
   *
   * SQL Query:
   * SELECT * FROM templates
   * WHERE shop_id = ? AND (is_active = ? OR TRUE)
   * ORDER BY created_at DESC
   * LIMIT ? OFFSET ?
   */
  async findByShop(
    shopId: string,
    options?: {
      skip?: number;
      take?: number;
      isActive?: boolean;
    },
  ): Promise<TemplateModel[]> {
    const templates = await this.prisma.template.findMany({
      where: {
        shopId,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });

    return templates.map((t) => TemplateModel.fromPersistence(t));
  }

  /**
   * Template-ek száma
   *
   * SQL Query:
   * SELECT COUNT(*) FROM templates WHERE shop_id = ? AND (is_active = ? OR TRUE)
   */
  async count(shopId: string, isActive?: boolean): Promise<number> {
    return this.prisma.template.count({
      where: {
        shopId,
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  /**
   * Új template mentése (field-ekkel és szekciókkal együtt)
   *
   * Transaction:
   * 1. Template INSERT
   * 2. Field-ek INSERT (batch)
   * 3. Szekciók INSERT (batch) + szekció field-ek
   *
   * SQL Queries:
   * INSERT INTO templates (...) VALUES (...) RETURNING *
   * INSERT INTO template_fields (...) VALUES (...), (...), ...
   * INSERT INTO template_sections (...) VALUES (...), (...), ...
   */
  async save(template: TemplateModel): Promise<TemplateModel> {
    // Use transaction to create template and sections with fields
    const created = await this.prisma.$transaction(async (tx) => {
      // 1. Create template (no top-level fields - all fields are in sections)
      const newTemplate = await tx.template.create({
        data: template.toPersistence(),
      });

      // 2. Create sections with their fields
      for (const section of template.sections) {
        const { templateId, id, createdAt, updatedAt, ...sectionData } = section.toPersistence();

        const newSection = await tx.templateSection.create({
          data: {
            ...sectionData,
            templateId: newTemplate.id,
          },
        });

        // 3. Create fields for this section
        for (const field of section.fields) {
          const { templateId: _tid, sectionId: _sid, id: _id, createdAt: _ca, updatedAt: _ua, ...fieldData } = field.toPersistence();

          await tx.templateField.create({
            data: {
              ...fieldData,
              templateId: newTemplate.id,
              sectionId: newSection.id,
            },
          });
        }
      }

      // 4. Return the complete template with all relations
      return tx.template.findUnique({
        where: { id: newTemplate.id },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
    });

    if (!created) {
      throw new Error('Failed to create template');
    }

    return TemplateModel.fromPersistence(created);
  }

  /**
   * Template frissítése (field-ekkel és szekciókkal együtt)
   *
   * Stratégia:
   * 1. Régi field-ek törlése (szekción kívüliek)
   * 2. Régi szekciók törlése (cascade törli a szekció field-eket)
   * 3. Template UPDATE
   * 4. Új field-ek és szekciók INSERT
   *
   * Transaction:
   * DELETE FROM template_fields WHERE template_id = ? AND section_id IS NULL
   * DELETE FROM template_sections WHERE template_id = ?
   * UPDATE templates SET ... WHERE id = ?
   * INSERT INTO template_fields (...) VALUES (...), (...)
   * INSERT INTO template_sections (...) VALUES (...), (...)
   */
  async update(template: TemplateModel): Promise<TemplateModel> {
    // Transaction: delete old data, update template, create new sections/fields
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Delete ALL old fields
      await tx.templateField.deleteMany({
        where: { templateId: template.id },
      });

      // 2. Delete old sections
      await tx.templateSection.deleteMany({
        where: { templateId: template.id },
      });

      // 3. Update template basic data
      await tx.template.update({
        where: { id: template.id },
        data: template.toPersistence(),
      });

      // 4. Create sections with their fields
      for (const section of template.sections) {
        const { templateId: _tid, id: _id, createdAt: _ca, updatedAt: _ua, ...sectionData } = section.toPersistence();

        const newSection = await tx.templateSection.create({
          data: {
            ...sectionData,
            templateId: template.id,
          },
        });

        // Create fields for this section
        for (const field of section.fields) {
          const { templateId: _tid2, sectionId: _sid, id: _id2, createdAt: _ca2, updatedAt: _ua2, ...fieldData } = field.toPersistence();

          await tx.templateField.create({
            data: {
              ...fieldData,
              templateId: template.id,
              sectionId: newSection.id,
            },
          });
        }
      }

      // 5. Return the complete updated template
      return tx.template.findUnique({
        where: { id: template.id },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: {
              fields: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
    });

    return TemplateModel.fromPersistence(updated);
  }

  /**
   * Template törlése (cascade: field-ek is törlődnek)
   *
   * SQL Queries:
   * DELETE FROM template_fields WHERE template_id = ?
   * DELETE FROM templates WHERE id = ? AND shop_id = ?
   *
   * Note: Prisma schema-ban: onDelete: Cascade
   */
  async delete(id: string, shopId: string): Promise<void> {
    await this.prisma.template.delete({
      where: {
        id,
        shopId, // Multi-tenant security
      },
    });
  }
}
