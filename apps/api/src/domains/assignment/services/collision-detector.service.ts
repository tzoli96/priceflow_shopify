import { Injectable, Inject } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../../template/repositories/template.repository.interface';
import type { ITemplateRepository } from '../../template/repositories/template.repository.interface';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { TemplateModel } from '../../template/models/template.model';
import { ScopeType } from '@prisma/client';

export interface CollisionGroup {
  scopeType: ScopeType;
  scopeValue: string | null;
  templates: {
    id: string;
    name: string;
    priority: number;
  }[];
}

/**
 * Collision Detector Service
 *
 * Felelősség: Template ütközések detektálása
 *
 * Ütközés definíció:
 * - Két vagy több template ugyanazt a scope-ot célozza meg (pl. ugyanaz a product ID)
 * - A priority alapján dől el, melyik template alkalmazandó
 *
 * Funkciók:
 * - detectCollisions: Shop-hoz tartozó összes template ütközéseinek detektálása
 * - getTemplatesForProduct: Adott product ID-hoz tartozó templates prioritás szerint
 */
@Injectable()
export class CollisionDetectorService {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * Shop domain → UUID konverzió
   */
  private async getShopIdFromDomain(shopDomain: string): Promise<string> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }
    return shop.id;
  }

  /**
   * Detect collisions
   *
   * Visszaad egy listát az ütköző template csoportokról.
   * Minden csoport egy scope value-t reprezentál, ahol több template is alkalmazható.
   */
  async detectCollisions(shopDomain: string): Promise<CollisionGroup[]> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Aktív template-ek lekérése
    const templates = await this.templateRepository.findByShop(shopId, {
      isActive: true,
      take: 1000, // High limit to get all templates
    });

    if (templates.length === 0) {
      return [];
    }

    // Csoport map: scopeType+scopeValue → templates
    const collisionMap = new Map<string, TemplateModel[]>();

    for (const template of templates) {
      if (template.scopeType === ScopeType.GLOBAL) {
        // GLOBAL scope: minden termékre vonatkozik
        const key = 'GLOBAL:*';
        if (!collisionMap.has(key)) {
          collisionMap.set(key, []);
        }
        collisionMap.get(key)!.push(template);
      } else {
        // PRODUCT, COLLECTION, VENDOR, TAG: scopeValues alapján
        for (const scopeValue of template.scopeValues) {
          const key = `${template.scopeType}:${scopeValue}`;
          if (!collisionMap.has(key)) {
            collisionMap.set(key, []);
          }
          collisionMap.get(key)!.push(template);
        }
      }
    }

    // Csak azok a csoportok, ahol több template is van (ütközés)
    const collisions: CollisionGroup[] = [];

    for (const [key, groupTemplates] of collisionMap.entries()) {
      if (groupTemplates.length > 1) {
        const [scopeType, scopeValue] = key.split(':');

        collisions.push({
          scopeType: scopeType as ScopeType,
          scopeValue: scopeValue === '*' ? null : scopeValue,
          templates: groupTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            priority: 0, // Assignment-ből kellene lekérni, de most nincs assignment model a template-ben
          })),
        });
      }
    }

    return collisions;
  }

  /**
   * Get templates for product
   *
   * Visszaadja az összes template-et, ami az adott productId-re vonatkozik,
   * priority szerint rendezve (legmagasabb priority először).
   *
   * @param shopDomain - Shop domain
   * @param productId - Shopify product ID
   * @param productData - Product metadata (vendor, tags, collections)
   * @returns Template lista priority szerint
   */
  async getTemplatesForProduct(
    shopDomain: string,
    productId: string,
    productData?: {
      vendor?: string;
      tags?: string[];
      collectionIds?: string[];
    },
  ): Promise<TemplateModel[]> {
    const shopId = await this.getShopIdFromDomain(shopDomain);

    // Aktív template-ek lekérése
    const templates = await this.templateRepository.findByShop(shopId, {
      isActive: true,
      take: 1000,
    });

    // Szűrés: mely template-ek vonatkoznak erre a product-ra?
    const applicableTemplates = templates.filter((template) => {
      if (template.scopeType === ScopeType.GLOBAL) {
        return true;
      }

      if (template.scopeType === ScopeType.PRODUCT) {
        return template.scopeValues.includes(productId);
      }

      if (template.scopeType === ScopeType.VENDOR && productData?.vendor) {
        return template.scopeValues.includes(productData.vendor);
      }

      if (template.scopeType === ScopeType.TAG && productData?.tags) {
        return template.scopeValues.some((tag) => productData.tags!.includes(tag));
      }

      if (template.scopeType === ScopeType.COLLECTION && productData?.collectionIds) {
        return template.scopeValues.some((collectionId) =>
          productData.collectionIds!.includes(collectionId),
        );
      }

      return false;
    });

    // Rendezés priority szerint (assignment-ből kellene, most placeholder: GLOBAL < TAG < VENDOR < COLLECTION < PRODUCT)
    return applicableTemplates.sort((a, b) => {
      const priorityMap = {
        [ScopeType.GLOBAL]: 1,
        [ScopeType.TAG]: 2,
        [ScopeType.VENDOR]: 3,
        [ScopeType.COLLECTION]: 4,
        [ScopeType.PRODUCT]: 5,
      };

      const aPriority = priorityMap[a.scopeType] || 0;
      const bPriority = priorityMap[b.scopeType] || 0;

      // Magasabb priority először
      return bPriority - aPriority;
    });
  }
}
