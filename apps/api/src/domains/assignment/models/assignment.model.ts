/**
 * Assignment Domain Model
 *
 * Felelősség: Template-ek hozzárendelése shop-okhoz
 *
 * Funkcionalitás:
 * - Template → Shop kapcsolat
 * - Priority (ütközések kezelésére)
 * - Active/Inactive állapot
 */

export class AssignmentModel {
  constructor(
    public readonly id: string,
    public readonly shopId: string,
    public readonly templateId: string,
    public priority: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ========== FACTORY METHODS ==========

  /**
   * Create new assignment
   */
  static create(
    shopId: string,
    templateId: string,
    priority: number = 0,
  ): AssignmentModel {
    AssignmentModel.validatePriority(priority);

    const now = new Date();

    return new AssignmentModel(
      crypto.randomUUID(),
      shopId,
      templateId,
      priority,
      true,
      now,
      now,
    );
  }

  /**
   * Load from database
   */
  static fromPersistence(data: {
    id: string;
    shopId: string;
    templateId: string;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AssignmentModel {
    return new AssignmentModel(
      data.id,
      data.shopId,
      data.templateId,
      data.priority,
      data.isActive,
      data.createdAt,
      data.updatedAt,
    );
  }

  // ========== DOMAIN BEHAVIOR ==========

  /**
   * Activate assignment
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivate assignment
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Update priority
   */
  updatePriority(newPriority: number): void {
    AssignmentModel.validatePriority(newPriority);
    this.priority = newPriority;
  }

  // ========== VALIDATIONS ==========

  private static validatePriority(priority: number): void {
    if (priority < 0) {
      throw new Error('Priority cannot be negative');
    }
  }

  // ========== PERSISTENCE MAPPING ==========

  /**
   * Convert to database persistence format
   */
  toPersistence() {
    return {
      id: this.id,
      shopId: this.shopId,
      templateId: this.templateId,
      priority: this.priority,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: new Date(), // Always update timestamp
    };
  }
}
