import { Injectable } from '@nestjs/common';
import { shopifyApi, Shopify, ApiVersion, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { loadEnv } from '../../../lib/env';
import { PrismaService } from '../../common/database/prisma.service';
import { DatabaseSessionStorage } from './database-session-storage';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Shopify Service
 *
 * Felelősség: Shopify API client inicializálása és OAuth kezelése
 *
 * Funkciók:
 * - Shopify credentials betöltése LocalStack Secrets Manager-ből
 * - Shopify API client inicializálása custom session storage-gel
 * - OAuth URL generálása
 * - OAuth callback kezelése
 *
 * Session Storage:
 * - Használ DatabaseSessionStorage-t cookie-k helyett
 * - OAuth session-öket PostgreSQL-ben tárolja
 * - Megoldja a cross-site OAuth redirect cookie problémáját
 */
@Injectable()
export class ShopifyService {
  private shopify: Shopify;
  private config: {
    apiKey: string;
    apiSecret: string;
    host: string;
    scopes: string[];
  };
  private sessionStorage: DatabaseSessionStorage;

  constructor(private readonly prisma: PrismaService) {
    this.sessionStorage = new DatabaseSessionStorage(prisma);
    this.initializeShopify();
  }

  /**
   * Shopify API inicializálása LocalStack Secrets-ből
   *
   * Betölti:
   * - SHOPIFY_API_KEY: Shopify app publikus kulcsa
   * - SHOPIFY_API_SECRET: Shopify app titkos kulcsa
   * - HOST: Az alkalmazás host neve (pl. app.teszt.uk)
   *
   * Session Storage:
   * - DatabaseSessionStorage használata cookie-k helyett
   * - OAuth session-ök PostgreSQL-ben tárolva
   */
  private async initializeShopify() {
    const env = await loadEnv();

    this.config = {
      apiKey: env.SHOPIFY_API_KEY || '',
      apiSecret: env.SHOPIFY_API_SECRET || '',
      host: env.HOST || 'app.teszt.uk',
      scopes: ['read_products', 'write_products', 'read_orders', 'read_customers'],
    };

    this.shopify = shopifyApi({
      apiKey: this.config.apiKey,
      apiSecretKey: this.config.apiSecret,
      scopes: this.config.scopes,
      hostName: this.config.host,
      hostScheme: 'https',
      apiVersion: ApiVersion.October24,
      isEmbeddedApp: true,
      sessionStorage: this.sessionStorage,
    });

    console.log('[ShopifyService] Initialized with host:', this.config.host);
    console.log('[ShopifyService] Using DatabaseSessionStorage for OAuth sessions');
  }

  /**
   * OAuth kezdeményezése
   *
   * @param shop - Shop domain (pl. "example.myshopify.com")
   * @returns OAuth authorization URL ahova átirányítjuk a usert
   *
   * Folyamat:
   * 1. Shop domain normalizálása
   * 2. Session létrehozása és mentése DatabaseSessionStorage-ba
   * 3. OAuth URL építése state paraméterrel
   * 4. OAuth URL visszaadása
   *
   * Session storage:
   * - Manuálisan létrehozunk egy session-t shop + state paraméterekkel
   * - Session mentődik az OAuthSession táblába
   * - Callback során a library megkeresi ezt a session-t state alapján
   */
  async beginAuth(shop: string): Promise<string> {
    if (!this.shopify) {
      await this.initializeShopify();
    }

    // Normalize shop domain (add .myshopify.com if missing)
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Generate random state for CSRF protection
    const state = this.shopify.auth.nonce();

    // Create session and store it
    const session = new Session({
      id: `offline_${shopDomain}`,
      shop: shopDomain,
      state,
      isOnline: false,
    });

    // Store session in database
    await this.sessionStorage.storeSession(session);

    // Build OAuth URL manually with state
    const redirectUri = `https://${this.config.host}/api/auth/callback`;
    const scopes = this.config.scopes.join(',');

    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${this.config.apiKey}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    console.log('[ShopifyService] OAuth started for shop:', shopDomain);
    console.log('[ShopifyService] Session stored in database with state:', state);

    return authUrl;
  }

  /**
   * OAuth callback feldolgozása
   *
   * @param request - HTTP request object (NestJS Request)
   * @returns Session object (shop, accessToken, scope)
   *
   * Folyamat:
   * 1. State és code kiolvasása a query paraméterekből
   * 2. Session betöltése state alapján az adatbázisból
   * 3. HMAC validálás
   * 4. Code → Access token csere
   * 5. Session frissítése access token-nel
   * 6. Visszaadás a controller-nek
   */
  async handleCallback(request: any): Promise<{
    shop: string;
    accessToken: string;
    scope: string[];
  }> {
    if (!this.shopify) {
      await this.initializeShopify();
    }

    const { shop, code, state, hmac, timestamp } = request.query;

    if (!shop || !code || !state) {
      throw new Error('Missing required OAuth callback parameters');
    }

    console.log('[ShopifyService] Processing callback for shop:', shop, 'with state:', state);

    // Load session from database by finding the session with this shop and state
    const sessionId = `offline_${shop}`;
    const session = await this.sessionStorage.loadSession(sessionId);

    if (!session) {
      throw new Error(`No session found for shop: ${shop}`);
    }

    if (session.state !== state) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    console.log('[ShopifyService] Session found, validating HMAC...');

    // Validate HMAC
    const isValid = this.validateHmac(request.query);

    if (!isValid) {
      throw new Error('Invalid HMAC signature');
    }

    console.log('[ShopifyService] HMAC valid, exchanging code for access token...');

    // Exchange code for access token using axios
    let accessToken: string;
    let scope: string;

    try {
      console.log('[ShopifyService] Attempting token exchange with shop:', shop);

      const response = await axios.post(
        `https://${shop}/admin/oauth/access_token`,
        {
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret,
          code,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PriceFlow-App/1.0',
          },
          timeout: 30000, // 30 seconds timeout
          family: 4, // Force IPv4 (disable IPv6)
        }
      );

      console.log('[ShopifyService] Token exchange response status:', response.status);

      accessToken = response.data.access_token;
      scope = response.data.scope;

      if (!accessToken) {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('[ShopifyService] Token exchange error:', error);
      throw new Error(`Failed to exchange code for access token: ${error.message}`);
    }

    console.log('[ShopifyService] Access token received, updating session...');

    // Update session with access token
    session.accessToken = accessToken;
    session.scope = scope;

    // Store updated session
    await this.sessionStorage.storeSession(session);

    console.log('[ShopifyService] OAuth completed for shop:', shop);

    return {
      shop,
      accessToken,
      scope: scope.split(','),
    };
  }

  /**
   * Shopify API key lekérése (publikus, frontend-nek kell)
   *
   * @returns Shopify API key (publikus)
   *
   * Használat: App Bridge inicializálásához a Next.js-ben
   */
  async getApiKey(): Promise<string> {
    if (!this.config) {
      await this.initializeShopify();
    }

    return this.config.apiKey;
  }

  /**
   * Shopify REST API client létrehozása shop-hoz
   *
   * @param shop - Shop domain
   * @param accessToken - OAuth access token
   * @returns Shopify REST API client
   *
   * Használat: Shopify API hívásokhoz (products, collections, stb.)
   */
  getRestClient(shop: string, accessToken: string) {
    if (!this.shopify) {
      throw new Error('Shopify not initialized');
    }

    // Create a minimal Session object
    const session = new Session({
      id: `offline_${shop}`,
      shop,
      state: 'offline',
      isOnline: false,
      accessToken,
      scope: this.config.scopes.join(','),
    });

    return new this.shopify.clients.Rest({
      session,
    });
  }

  /**
   * HMAC validálás Shopify OAuth callback-hez
   *
   * @param query - Query paraméterek az OAuth callback URL-ből
   * @returns true ha valid, false ha invalid
   *
   * Shopify HMAC validálás:
   * 1. Összes query paraméter kivéve 'hmac' és 'signature'
   * 2. Ábécé sorrendbe rendezés
   * 3. 'key=value&key2=value2' formátumba alakítás
   * 4. HMAC-SHA256 hash generálása a secret key-vel
   * 5. Összehasonlítás a kapott HMAC-el
   */
  private validateHmac(query: Record<string, string>): boolean {
    const { hmac, signature, ...params } = query;

    if (!hmac) {
      return false;
    }

    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    // Generate HMAC
    const hash = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(sortedParams)
      .digest('hex');

    // Compare
    return hash === hmac;
  }
}
