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
        fields: {
          orderBy: {
            order: 'asc', // Field-ek rendezve order szerint
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
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
   * Új template mentése (field-ekkel együtt)
   *
   * Transaction:
   * 1. Template INSERT
   * 2. Field-ek INSERT (batch)
   *
   * SQL Queries:
   * INSERT INTO templates (...) VALUES (...) RETURNING *
   * INSERT INTO template_fields (...) VALUES (...), (...), ...
   */
  async save(template: TemplateModel): Promise<TemplateModel> {
    const created = await this.prisma.template.create({
      data: {
        ...template.toPersistence(),
        fields: {
          create: template.fields.map((f) => {
            const { templateId, id, createdAt, updatedAt, ...fieldData } = f.toPersistence();
            return fieldData;
          }),
        },
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return TemplateModel.fromPersistence(created);
  }

  /**
   * Template frissítése (field-ekkel együtt)
   *
   * Stratégia:
   * 1. Régi field-ek törlése
   * 2. Template UPDATE
   * 3. Új field-ek INSERT
   *
   * Transaction:
   * DELETE FROM template_fields WHERE template_id = ?
   * UPDATE templates SET ... WHERE id = ?
   * INSERT INTO template_fields (...) VALUES (...), (...)
   */
  async update(template: TemplateModel): Promise<TemplateModel> {
    // Transaction: delete old fields, update template, create new fields
    const updated = await this.prisma.$transaction(async (tx) => {
      // Delete old fields
      await tx.templateField.deleteMany({
        where: {
          templateId: template.id,
        },
      });

      // Update template and create new fields
      return tx.template.update({
        where: {
          id: template.id,
        },
        data: {
          ...template.toPersistence(),
          fields: {
            create: template.fields.map((f) => {
              const { templateId, id, createdAt, updatedAt, ...fieldData } = f.toPersistence();
              return fieldData;
            }),
          },
        },
        include: {
          fields: {
            orderBy: {
              order: 'asc',
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
