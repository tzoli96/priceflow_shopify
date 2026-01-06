import { Controller, Get, Query, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ShopifyService } from '../services/shopify.service';
import { ShopService } from '../../shop/services/shop.service';

/**
 * Auth Controller
 *
 * Felelősség: Shopify OAuth flow kezelése
 *
 * Végpontok:
 * - GET /api/auth - OAuth kezdeményezése
 * - GET /api/auth/callback - OAuth callback kezelése
 * - GET /api/auth/config - Publikus konfiguráció (API key)
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly shopService: ShopService,
  ) {}

  /**
   * GET /api/auth
   *
   * OAuth kezdeményezése
   *
   * Query paraméterek:
   * - shop: Shop domain (kötelező, pl. "example.myshopify.com")
   *
   * Válasz:
   * - 302 Redirect: Shopify OAuth engedélyező oldalra
   * - 400 Bad Request: Hiányzó shop paraméter
   *
   * Folyamat:
   * 1. Shop domain validálása
   * 2. OAuth URL generálása Shopify-nál
   * 3. Átirányítás az OAuth oldalra
   *
   * Példa használat:
   * GET /api/auth?shop=example.myshopify.com
   * → Redirect to: https://example.myshopify.com/admin/oauth/authorize?client_id=...
   */
  @Get()
  async beginAuth(
    @Query('shop') shop: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!shop) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Missing shop parameter',
        message: 'Shop parameter is required for OAuth',
      });
      return;
    }

    try {
      console.log('[AuthController] Starting OAuth for shop:', shop);

      const authUrl = await this.shopifyService.beginAuth(shop);

      console.log('[AuthController] Redirecting to:', authUrl);

      res.redirect(authUrl);
    } catch (error) {
      console.error('[AuthController] OAuth begin error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to begin OAuth',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/auth/callback
   *
   * OAuth callback - Shopify visszahívja ezt miután user engedélyezte az app-ot
   *
   * Query paraméterek (Shopify küldi):
   * - shop: Shop domain
   * - code: OAuth authorization code
   * - hmac: Security signature
   * - host: Base64 encoded host
   * - timestamp: Request timestamp
   *
   * Válasz:
   * - 302 Redirect: Next.js admin app-ra (?shop=...&host=...)
   * - 500 Internal Server Error: OAuth hiba
   *
   * Folyamat:
   * 1. Shopify validálja a callback-et (HMAC signature check)
   * 2. Authorization code → Access token csere
   * 3. Access token tárolása adatbázisban (Shop táblában)
   * 4. Átirányítás a Next.js admin app-ra
   *
   * Példa használat:
   * GET /api/auth/callback?shop=example.myshopify.com&code=abc123&hmac=...&host=...
   * → Shop session mentve DB-be
   * → Redirect to: https://app.teszt.uk/?shop=example.myshopify.com&host=...
   */
  @Get('callback')
  async handleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      console.log('[AuthController] OAuth callback received');

      // OAuth callback feldolgozása - access token lekérése
      const session = await this.shopifyService.handleCallback(req);

      console.log('[AuthController] Session received for shop:', session.shop);

      // Session tárolása adatbázisban
      await this.shopService.storeSession({
        shop: session.shop,
        accessToken: session.accessToken,
        scope: session.scope.join(','),
      });

      console.log('[AuthController] Session stored in database');

      // Átirányítás a Next.js admin app-ra
      const host = req.query.host as string;
      const redirectUrl = new URL('/', `https://${process.env.HOST || 'app.teszt.uk'}`);
      if (host) {
        redirectUrl.searchParams.set('host', host);
      }

      console.log('[AuthController] Redirecting to:', redirectUrl.toString());

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('[AuthController] OAuth callback error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'OAuth callback failed',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/auth/config
   *
   * Publikus konfiguráció lekérése (Shopify API key)
   *
   * Query paraméterek: Nincs
   *
   * Válasz:
   * {
   *   "shopifyApiKey": "a2087c36b3d88c748e9e2339ebab5527"
   * }
   *
   * Használat:
   * - Next.js App Bridge inicializálásához szükséges
   * - Publikus adat, nem titkos
   *
   * Folyamat:
   * 1. Shopify API key lekérése LocalStack Secrets-ből
   * 2. JSON válaszban visszaadás
   *
   * Példa használat:
   * GET /api/auth/config
   * → { "shopifyApiKey": "a2087c36..." }
   */
  @Get('config')
  async getConfig() {
    try {
      const apiKey = await this.shopifyService.getApiKey();

      return {
        shopifyApiKey: apiKey,
      };
    } catch (error) {
      console.error('[AuthController] Failed to get config:', error);
      throw error;
    }
  }
}
