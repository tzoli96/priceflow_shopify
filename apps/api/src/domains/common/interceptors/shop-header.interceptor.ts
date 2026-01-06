import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Shop Header Interceptor
 *
 * Felelősség: Multi-tenant security - Shop domain validálás és context injection
 *
 * Funkciók:
 * 1. X-Shopify-Shop header ellenőrzése
 * 2. Shop domain validálása (*.myshopify.com formátum)
 * 3. Shop context injection a request-be
 * 4. Hiányzó header esetén 401 Unauthorized
 *
 * Használat:
 * - Globálisan az app.module.ts-ben regisztrálva
 * - Minden API hívás kötelezően tartalmazza az X-Shopify-Shop header-t
 * - Controller-ekben: @ShopId() decorator-ral elérhető a shopDomain
 *
 * Példa:
 * ```
 * Request:
 * GET /api/templates
 * Header: X-Shopify-Shop: example.myshopify.com
 *
 * → Interceptor validates
 * → Injects shopDomain into request
 * → Controller accesses via @ShopId() decorator
 * ```
 */
@Injectable()
export class ShopHeaderInterceptor implements NestInterceptor {
  // Whitelist: endpoints that don't require X-Shopify-Shop header
  private readonly publicEndpoints = [
    '/api/auth',           // OAuth flow
    '/api/auth/callback',  // OAuth callback
    '/api/shopify/current', // Current shop from database (single-shop mode)
    '/api/shopify/status',  // Shop status check
    '/api/shopify/dev-setup', // Dev shop setup
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.url.split('?')[0]; // Remove query params

    // Skip validation for public endpoints (OAuth, etc.)
    if (this.publicEndpoints.some((endpoint) => path.startsWith(endpoint))) {
      console.log(`[ShopHeaderInterceptor] Skipping validation for public endpoint: ${path}`);
      return next.handle();
    }

    // Extract shop header
    const shopHeader = request.headers['x-shopify-shop'];

    if (!shopHeader) {
      throw new UnauthorizedException(
        'Missing X-Shopify-Shop header. Please authenticate first.',
      );
    }

    // Validate shop domain format (*.myshopify.com)
    const shopDomain = shopHeader.toLowerCase();
    const isValidDomain = /^[a-z0-9-]+\.myshopify\.com$/.test(shopDomain);

    if (!isValidDomain) {
      throw new UnauthorizedException(
        `Invalid shop domain format: ${shopDomain}. Expected: *.myshopify.com`,
      );
    }

    // Inject shop domain into request for later use
    request.shopDomain = shopDomain;

    console.log(`[ShopHeaderInterceptor] Request from shop: ${shopDomain}`);

    return next.handle();
  }
}

/**
 * Shop ID Decorator
 *
 * Használat controller-ekben a shop domain kiolvasásához
 *
 * Példa:
 * ```ts
 * @Get()
 * async listTemplates(@ShopId() shopId: string) {
 *   // shopId = "example.myshopify.com"
 *   return this.templateService.listTemplates(shopId);
 * }
 * ```
 */
import { createParamDecorator } from '@nestjs/common';

export const ShopId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.shopDomain;
  },
);
