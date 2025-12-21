export class ShopModel {
  constructor(
    public readonly id: string,
    public readonly domain: string,
    private _accessToken: string,
    public readonly scope: string | null,
    public isActive: boolean,
    public readonly installedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public uninstalledAt: Date | null = null,
  ) {}

  // ========== FACTORY METHODS ==========

  /**
   * Create new shop
   */
  static create(domain: string, accessToken: string, scope?: string): ShopModel {
    ShopModel.validateDomain(domain);
    ShopModel.validateAccessToken(accessToken);

    const now = new Date();

    return new ShopModel(
      crypto.randomUUID(),
      domain,
      accessToken,
      scope || null,
      true,
      now,
      now,
      now,
      null,
    );
  }

  /**
   * Load from database
   */
  static fromPersistence(data: {
    id: string;
    domain: string;
    accessToken: string;
    scope: string | null;
    isActive: boolean;
    installedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    uninstalledAt: Date | null;
  }): ShopModel {
    return new ShopModel(
      data.id,
      data.domain,
      data.accessToken,
      data.scope,
      data.isActive,
      data.installedAt,
      data.createdAt,
      data.updatedAt,
      data.uninstalledAt,
    );
  }

  // ========== DOMAIN BEHAVIOR ==========

  /**
   * Activate shop
   */
  activate(): void {
    this.isActive = true;
    this.uninstalledAt = null;
  }

  /**
   * Deactivate shop
   */
  deactivate(): void {
    this.isActive = false;
    this.uninstalledAt = new Date();
  }

  /**
   * Update access token
   */
  updateAccessToken(newToken: string, newScope?: string): void {
    ShopModel.validateAccessToken(newToken);
    this._accessToken = newToken;
    if (newScope !== undefined) {
      (this as any).scope = newScope;
    }
  }

  /**
   * Getter - encapsulation
   */
  get accessToken(): string {
    return this._accessToken;
  }

  // ========== VALIDATIONS ==========

  private static validateDomain(domain: string): void {
    if (!domain || !domain.includes('.myshopify.com')) {
      throw new Error('Invalid Shopify domain format');
    }
  }

  private static validateAccessToken(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new Error('Access token cannot be empty');
    }
  }

  // ========== PERSISTENCE MAPPING ==========

  /**
   * Convert to database persistence format
   */
  toPersistence() {
    return {
      id: this.id,
      domain: this.domain,
      accessToken: this._accessToken,
      scope: this.scope,
      isActive: this.isActive,
      installedAt: this.installedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(), // Always update timestamp
      uninstalledAt: this.uninstalledAt,
    };
  }
}
