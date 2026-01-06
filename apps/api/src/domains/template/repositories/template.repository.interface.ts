import { TemplateModel } from '../models/template.model';

/**
 * Template Repository Interface
 *
 * Felelősség: Template perzisztencia műveletek absztrakciója
 *
 * Dependency Inversion Principle: Service függ az interface-től, nem a konkrét implementációtól
 *
 * Műveletek:
 * - findById: Template lekérése ID alapján
 * - findByShop: Shop összes template-je
 * - save: Új template mentése
 * - update: Meglévő template frissítése
 * - delete: Template törlése
 * - count: Template-ek száma (pagination-höz)
 */
export interface ITemplateRepository {
  /**
   * Template lekérése ID alapján
   *
   * @param id - Template ID (UUID)
   * @param shopId - Shop ID (multi-tenant security)
   * @returns TemplateModel vagy null ha nem található
   */
  findById(id: string, shopId: string): Promise<TemplateModel | null>;

  /**
   * Shop összes template-jének lekérése
   *
   * @param shopId - Shop ID
   * @param options - Pagination és filter opciók
   * @returns Template-ek listája
   */
  findByShop(
    shopId: string,
    options?: {
      skip?: number;
      take?: number;
      isActive?: boolean;
    },
  ): Promise<TemplateModel[]>;

  /**
   * Template-ek számának lekérése (pagination-höz)
   *
   * @param shopId - Shop ID
   * @param isActive - Opcionális: csak aktív template-ek
   * @returns Template-ek száma
   */
  count(shopId: string, isActive?: boolean): Promise<number>;

  /**
   * Új template mentése
   *
   * @param template - TemplateModel instance
   * @returns Mentett template (DB által generált ID-val)
   */
  save(template: TemplateModel): Promise<TemplateModel>;

  /**
   * Meglévő template frissítése
   *
   * @param template - TemplateModel instance frissített adatokkal
   * @returns Frissített template
   */
  update(template: TemplateModel): Promise<TemplateModel>;

  /**
   * Template törlése
   *
   * @param id - Template ID
   * @param shopId - Shop ID (multi-tenant security)
   */
  delete(id: string, shopId: string): Promise<void>;
}

/**
 * Dependency Injection token
 */
export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
