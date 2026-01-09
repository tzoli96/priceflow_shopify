# PRD Segment 2: Backend Draft Orders API Implementation

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft
**Priority:** P0 (Critical)
**Dependencies:** Segment 1 (Widget Extension)
**Part of:** Draft Orders Custom Pricing Implementation

---

## Executive Summary

This document outlines the **NestJS Backend API implementation** for Draft Orders management, enabling custom pricing (2x price) for products on non-Plus Shopify stores. This API serves as the backend for the Storefront Extension (Segment 1) and handles all Shopify Draft Order operations.

**Goal:** Build a robust, secure, and performant API that creates and manages Shopify Draft Orders with custom pricing, supports multiple products per order, and provides seamless checkout URLs.

---

## 1. Problem Statement

### Current State
- No backend infrastructure for Draft Orders
- No custom pricing logic
- No multi-product session management

### Desired State
- RESTful API for Draft Order creation
- Support for adding multiple products to single Draft Order
- Custom pricing calculation (2x multiplier)
- Session management for draft order tracking
- Secure communication with Shopify Admin API
- Error handling and retry logic

### Why Draft Orders?
- **Works on any Shopify plan** (Basic/Standard/Advanced) ✅
- **Full price control** via Shopify Admin API ✅
- **Custom pricing persists through checkout** ✅
- **No Shopify Plus required** ✅

---

## 2. User Stories

### US-001: Widget calls API to create Draft Order
```
GIVEN a customer clicks "Add to Cart (2x Price)" on product page
WHEN the widget sends POST request to /api/draft-orders/create
THEN the API creates a new Draft Order with 2x price
AND returns the checkout invoice URL
AND returns the Draft Order ID for session tracking
```

### US-002: Widget adds second product to existing Draft Order
```
GIVEN a customer has already created a Draft Order (session tracked)
WHEN the widget sends POST request to /api/draft-orders/{id}/add-item
THEN the API adds the new product to the existing Draft Order
AND recalculates totals
AND returns the updated invoice URL
```

### US-003: API validates shop authentication
```
GIVEN a request arrives with X-Shopify-Shop header
WHEN the API validates the shop domain
THEN it retrieves the shop's access token from database
AND uses it for Shopify API calls
OR returns 401 Unauthorized if shop not installed
```

### US-004: API handles Shopify API failures gracefully
```
GIVEN Shopify API rate limit is exceeded
WHEN the API receives 429 Too Many Requests
THEN it implements exponential backoff retry
AND logs the failure
AND returns appropriate error to client after max retries
```

---

## 3. Technical Specification

### 3.1 API Architecture

**Framework:** NestJS (Domain-Driven Design)
**Location:** `apps/api/src/domains/draft-order/`

**Domain Structure:**
```
apps/api/src/domains/draft-order/
├── controllers/
│   └── draft-order.controller.ts       # REST endpoints
├── services/
│   ├── draft-order.service.ts          # Business logic
│   └── draft-order-session.service.ts  # Session management
├── repositories/
│   └── draft-order.repository.ts       # Database operations
├── dto/
│   ├── create-draft-order.dto.ts       # Request validation
│   ├── add-item.dto.ts
│   └── draft-order-response.dto.ts     # Response formatting
├── entities/
│   └── draft-order-session.entity.ts   # Prisma model
├── utils/
│   ├── price-calculator.ts             # Price calculation logic
│   └── shopify-draft-order-builder.ts  # Shopify API request builder
└── draft-order.module.ts               # Module configuration
```

### 3.2 API Endpoints

#### **POST /api/draft-orders/create**

**Purpose:** Create new Draft Order with first product

**Request:**
```json
{
  "variantId": "gid://shopify/ProductVariant/123456",
  "quantity": 1,
  "originalPrice": 19.99,
  "customPrice": 39.98,
  "productTitle": "Example Product",
  "variantTitle": "Red / Large"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "draftOrderId": "gid://shopify/DraftOrder/789012",
  "invoiceUrl": "https://test-shop.myshopify.com/123456/invoices/abc123",
  "lineItems": [
    {
      "variantId": "gid://shopify/ProductVariant/123456",
      "title": "Example Product - Red / Large",
      "quantity": 1,
      "price": "39.98"
    }
  ],
  "total": "39.98",
  "currency": "USD"
}
```

**Errors:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Shop not authenticated
- `404 Not Found` - Variant not found in Shopify
- `429 Too Many Requests` - Shopify rate limit
- `500 Internal Server Error` - Shopify API failure

---

#### **POST /api/draft-orders/:id/add-item**

**Purpose:** Add product to existing Draft Order

**Path Parameter:**
- `id` - Draft Order ID (Shopify GID format)

**Request:**
```json
{
  "variantId": "gid://shopify/ProductVariant/654321",
  "quantity": 2,
  "originalPrice": 29.99,
  "customPrice": 59.98,
  "productTitle": "Another Product",
  "variantTitle": "Blue / Medium"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "draftOrderId": "gid://shopify/DraftOrder/789012",
  "invoiceUrl": "https://test-shop.myshopify.com/123456/invoices/abc123",
  "lineItems": [
    {
      "variantId": "gid://shopify/ProductVariant/123456",
      "title": "Example Product - Red / Large",
      "quantity": 1,
      "price": "39.98"
    },
    {
      "variantId": "gid://shopify/ProductVariant/654321",
      "title": "Another Product - Blue / Medium",
      "quantity": 2,
      "price": "59.98"
    }
  ],
  "total": "159.94",
  "currency": "USD"
}
```

**Errors:**
- `400 Bad Request` - Invalid input data
- `404 Not Found` - Draft Order not found
- `409 Conflict` - Draft Order already completed
- `429 Too Many Requests` - Shopify rate limit
- `500 Internal Server Error` - Shopify API failure

---

#### **GET /api/draft-orders/:id**

**Purpose:** Retrieve Draft Order details

**Response (200 OK):**
```json
{
  "success": true,
  "draftOrderId": "gid://shopify/DraftOrder/789012",
  "status": "open",
  "invoiceUrl": "https://test-shop.myshopify.com/123456/invoices/abc123",
  "lineItems": [...],
  "total": "159.94",
  "currency": "USD",
  "createdAt": "2026-01-07T10:30:00Z",
  "updatedAt": "2026-01-07T10:35:00Z"
}
```

---

#### **DELETE /api/draft-orders/:id**

**Purpose:** Cancel Draft Order (optional, for cleanup)

**Response (204 No Content)**

---

### 3.3 NestJS Controller Implementation

#### `controllers/draft-order.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DraftOrderService } from '../services/draft-order.service';
import { CreateDraftOrderDto } from '../dto/create-draft-order.dto';
import { AddItemDto } from '../dto/add-item.dto';
import { DraftOrderResponseDto } from '../dto/draft-order-response.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';

/**
 * Draft Order Controller
 *
 * Felelősség: Draft Order műveletek kezelése REST API-n keresztül
 *
 * Végpontok:
 * - POST /api/draft-orders/create - Új Draft Order létrehozása
 * - POST /api/draft-orders/:id/add-item - Termék hozzáadása meglévő Draft Order-hez
 * - GET /api/draft-orders/:id - Draft Order részletek lekérése
 * - DELETE /api/draft-orders/:id - Draft Order törlése
 */
@Controller('draft-orders')
export class DraftOrderController {
  constructor(private readonly draftOrderService: DraftOrderService) {}

  /**
   * POST /api/draft-orders/create
   *
   * Új Draft Order létrehozása egyedi árral
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createDraftOrder(
    @ShopId() shopDomain: string,
    @Body() dto: CreateDraftOrderDto,
  ): Promise<DraftOrderResponseDto> {
    console.log('[DraftOrderController] Creating draft order for shop:', shopDomain);

    const result = await this.draftOrderService.createDraftOrder(shopDomain, dto);

    console.log('[DraftOrderController] Draft order created:', result.draftOrderId);

    return result;
  }

  /**
   * POST /api/draft-orders/:id/add-item
   *
   * Termék hozzáadása meglévő Draft Order-hez
   */
  @Post(':id/add-item')
  @HttpCode(HttpStatus.OK)
  async addItemToDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') draftOrderId: string,
    @Body() dto: AddItemDto,
  ): Promise<DraftOrderResponseDto> {
    console.log('[DraftOrderController] Adding item to draft order:', draftOrderId);

    const result = await this.draftOrderService.addItemToDraftOrder(
      shopDomain,
      draftOrderId,
      dto,
    );

    console.log('[DraftOrderController] Item added to draft order');

    return result;
  }

  /**
   * GET /api/draft-orders/:id
   *
   * Draft Order részletek lekérése
   */
  @Get(':id')
  async getDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') draftOrderId: string,
  ): Promise<DraftOrderResponseDto> {
    console.log('[DraftOrderController] Fetching draft order:', draftOrderId);

    return this.draftOrderService.getDraftOrder(shopDomain, draftOrderId);
  }

  /**
   * DELETE /api/draft-orders/:id
   *
   * Draft Order törlése
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraftOrder(
    @ShopId() shopDomain: string,
    @Param('id') draftOrderId: string,
  ): Promise<void> {
    console.log('[DraftOrderController] Deleting draft order:', draftOrderId);

    await this.draftOrderService.deleteDraftOrder(shopDomain, draftOrderId);
  }
}
```

### 3.4 Service Layer Implementation

#### `services/draft-order.service.ts`

```typescript
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ShopifyService } from '../../auth/services/shopify.service';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';
import type { IShopRepository } from '../../shop/repositories/shop.repository.interface';
import { CreateDraftOrderDto } from '../dto/create-draft-order.dto';
import { AddItemDto } from '../dto/add-item.dto';
import { DraftOrderResponseDto } from '../dto/draft-order-response.dto';
import { calculateCustomPrice } from '../utils/price-calculator';
import { ShopifyDraftOrderBuilder } from '../utils/shopify-draft-order-builder';

/**
 * Draft Order Service
 *
 * Felelősség: Draft Order business logika
 *
 * Funkciók:
 * - Draft Order létrehozása Shopify Admin API-n keresztül
 * - Termék hozzáadása meglévő Draft Order-hez
 * - Draft Order részletek lekérése
 * - Draft Order törlése
 */
@Injectable()
export class DraftOrderService {
  constructor(
    private readonly shopifyService: ShopifyService,
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepository: IShopRepository,
  ) {}

  /**
   * Create new Draft Order with custom pricing
   */
  async createDraftOrder(
    shopDomain: string,
    dto: CreateDraftOrderDto,
  ): Promise<DraftOrderResponseDto> {
    // 1. Get shop access token
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    // 2. Build Shopify Draft Order request
    const draftOrderData = ShopifyDraftOrderBuilder.build({
      lineItems: [
        {
          variantId: dto.variantId,
          quantity: dto.quantity,
          customPrice: dto.customPrice,
          title: `${dto.productTitle} - ${dto.variantTitle}`,
        },
      ],
      note: 'PriceFlow custom pricing applied',
      tags: ['priceflow', 'custom-pricing'],
    });

    // 3. Call Shopify Admin API
    const client = this.shopifyService.getRestClient(shopDomain, shop.accessToken);

    try {
      const response = await client.post({
        path: 'draft_orders',
        data: draftOrderData,
      });

      const draftOrder = response.body.draft_order;

      console.log('[DraftOrderService] Draft Order created:', draftOrder.id);

      // 4. Return response DTO
      return DraftOrderResponseDto.fromShopifyDraftOrder(draftOrder);
    } catch (error) {
      console.error('[DraftOrderService] Failed to create draft order:', error);
      throw new Error(`Failed to create draft order: ${error.message}`);
    }
  }

  /**
   * Add item to existing Draft Order
   */
  async addItemToDraftOrder(
    shopDomain: string,
    draftOrderId: string,
    dto: AddItemDto,
  ): Promise<DraftOrderResponseDto> {
    // 1. Get shop access token
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const client = this.shopifyService.getRestClient(shopDomain, shop.accessToken);

    try {
      // 2. Fetch existing Draft Order
      const fetchResponse = await client.get({
        path: `draft_orders/${draftOrderId}`,
      });

      const existingDraftOrder = fetchResponse.body.draft_order;

      // 3. Append new line item
      const updatedLineItems = [
        ...existingDraftOrder.line_items,
        {
          variant_id: dto.variantId,
          quantity: dto.quantity,
          price: dto.customPrice.toFixed(2),
          title: `${dto.productTitle} - ${dto.variantTitle}`,
        },
      ];

      // 4. Update Draft Order
      const updateResponse = await client.put({
        path: `draft_orders/${draftOrderId}`,
        data: {
          draft_order: {
            line_items: updatedLineItems,
          },
        },
      });

      const updatedDraftOrder = updateResponse.body.draft_order;

      console.log('[DraftOrderService] Item added to draft order:', draftOrderId);

      return DraftOrderResponseDto.fromShopifyDraftOrder(updatedDraftOrder);
    } catch (error) {
      console.error('[DraftOrderService] Failed to add item:', error);
      throw new Error(`Failed to add item to draft order: ${error.message}`);
    }
  }

  /**
   * Get Draft Order details
   */
  async getDraftOrder(
    shopDomain: string,
    draftOrderId: string,
  ): Promise<DraftOrderResponseDto> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const client = this.shopifyService.getRestClient(shopDomain, shop.accessToken);

    try {
      const response = await client.get({
        path: `draft_orders/${draftOrderId}`,
      });

      const draftOrder = response.body.draft_order;

      return DraftOrderResponseDto.fromShopifyDraftOrder(draftOrder);
    } catch (error) {
      console.error('[DraftOrderService] Failed to fetch draft order:', error);
      throw new NotFoundException(`Draft Order not found: ${draftOrderId}`);
    }
  }

  /**
   * Delete Draft Order
   */
  async deleteDraftOrder(shopDomain: string, draftOrderId: string): Promise<void> {
    const shop = await this.shopRepository.findByDomain(shopDomain);
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopDomain}`);
    }

    const client = this.shopifyService.getRestClient(shopDomain, shop.accessToken);

    try {
      await client.delete({
        path: `draft_orders/${draftOrderId}`,
      });

      console.log('[DraftOrderService] Draft order deleted:', draftOrderId);
    } catch (error) {
      console.error('[DraftOrderService] Failed to delete draft order:', error);
      throw new Error(`Failed to delete draft order: ${error.message}`);
    }
  }
}
```

### 3.5 DTOs (Data Transfer Objects)

#### `dto/create-draft-order.dto.ts`

```typescript
import { IsString, IsNumber, IsPositive, IsNotEmpty, Min } from 'class-validator';

export class CreateDraftOrderDto {
  @IsString()
  @IsNotEmpty()
  variantId: string; // Shopify variant GID

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  originalPrice: number;

  @IsNumber()
  @IsPositive()
  customPrice: number;

  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @IsString()
  @IsNotEmpty()
  variantTitle: string;
}
```

#### `dto/draft-order-response.dto.ts`

```typescript
export class DraftOrderResponseDto {
  success: boolean;
  draftOrderId: string;
  invoiceUrl: string;
  lineItems: LineItemDto[];
  total: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;

  static fromShopifyDraftOrder(shopifyDraftOrder: any): DraftOrderResponseDto {
    return {
      success: true,
      draftOrderId: `gid://shopify/DraftOrder/${shopifyDraftOrder.id}`,
      invoiceUrl: shopifyDraftOrder.invoice_url,
      lineItems: shopifyDraftOrder.line_items.map((item: any) => ({
        variantId: `gid://shopify/ProductVariant/${item.variant_id}`,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      total: shopifyDraftOrder.total_price,
      currency: shopifyDraftOrder.currency,
      createdAt: shopifyDraftOrder.created_at,
      updatedAt: shopifyDraftOrder.updated_at,
    };
  }
}

export interface LineItemDto {
  variantId: string;
  title: string;
  quantity: number;
  price: string;
}
```

### 3.6 Utilities

#### `utils/shopify-draft-order-builder.ts`

```typescript
/**
 * Shopify Draft Order Builder
 *
 * Helper to build Shopify Admin API Draft Order requests
 */
export class ShopifyDraftOrderBuilder {
  static build(params: {
    lineItems: Array<{
      variantId: string;
      quantity: number;
      customPrice: number;
      title: string;
    }>;
    note?: string;
    tags?: string[];
  }): any {
    return {
      draft_order: {
        line_items: params.lineItems.map((item) => ({
          variant_id: this.extractNumericId(item.variantId),
          quantity: item.quantity,
          price: item.customPrice.toFixed(2),
          title: item.title,
          taxable: true,
        })),
        note: params.note || '',
        tags: params.tags?.join(', ') || '',
        use_customer_default_address: true,
      },
    };
  }

  /**
   * Extract numeric ID from Shopify GID
   * Example: "gid://shopify/ProductVariant/123456" → 123456
   */
  private static extractNumericId(gid: string): number {
    const parts = gid.split('/');
    return parseInt(parts[parts.length - 1], 10);
  }
}
```

---

## 4. Database Schema (Prisma)

### 4.1 Draft Order Session Tracking

**Purpose:** Track Draft Orders in session for multi-product support

**Schema (`prisma/schema.prisma`):**

```prisma
model DraftOrderSession {
  id              String       @id @default(uuid())
  shopId          String
  shop            Shop         @relation(fields: [shopId], references: [id], onDelete: Cascade)
  draftOrderId    String       @unique // Shopify Draft Order GID
  invoiceUrl      String
  status          DraftOrderStatus @default(OPEN)
  totalPrice      Decimal      @db.Decimal(10, 2)
  currency        String       @default("USD")
  lineItemsCount  Int          @default(0)
  metadata        Json?        // Extra data (tags, notes)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  expiresAt       DateTime     // Auto-expire after 24 hours

  @@index([shopId])
  @@index([draftOrderId])
  @@index([status])
  @@index([expiresAt])
}

enum DraftOrderStatus {
  OPEN
  COMPLETED
  INVOICE_SENT
  EXPIRED
}
```

### 4.2 Repository Implementation

```typescript
// repositories/draft-order.repository.ts
@Injectable()
export class DraftOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    shopId: string;
    draftOrderId: string;
    invoiceUrl: string;
    totalPrice: number;
    currency: string;
  }) {
    return this.prisma.draftOrderSession.create({
      data: {
        ...data,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  }

  async findById(draftOrderId: string) {
    return this.prisma.draftOrderSession.findUnique({
      where: { draftOrderId },
    });
  }

  async update(draftOrderId: string, data: any) {
    return this.prisma.draftOrderSession.update({
      where: { draftOrderId },
      data,
    });
  }
}
```

---

## 5. Error Handling & Retry Logic

### 5.1 Shopify API Error Handling

```typescript
// Common Shopify API errors
async function callShopifyWithRetry(
  apiCall: () => Promise<any>,
  maxRetries: number = 3,
): Promise<any> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      attempt++;

      // Rate limit: wait and retry
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 2;
        console.warn(`[Shopify API] Rate limited. Retrying after ${retryAfter}s...`);
        await this.sleep(retryAfter * 1000);
        continue;
      }

      // Transient errors: retry with exponential backoff
      if (error.response?.status >= 500) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`[Shopify API] Server error. Retrying after ${backoffMs}ms...`);
        await this.sleep(backoffMs);
        continue;
      }

      // Non-retryable error
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

private sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## 6. Security

### 6.1 Authentication
- `X-Shopify-Shop` header required on all requests
- Shop domain validated against database
- Access token retrieved securely from database

### 6.2 Input Validation
- `class-validator` decorators on all DTOs
- Price validation: must be positive, max 2 decimal places
- Variant ID format validation (Shopify GID)

### 6.3 Rate Limiting
- Implement rate limiting per shop (100 req/min)
- Shopify API rate limit handling with retry logic

---

## 7. Performance

### 7.1 Metrics
- API response time < 500ms (p95)
- Shopify API call latency < 300ms
- Database query latency < 50ms

### 7.2 Optimization
- Connection pooling (Prisma)
- Async/await proper usage
- Caching shop access tokens (Redis optional)

---

## 8. Testing

### 8.1 Unit Tests
- `DraftOrderService` - Mock Shopify API client
- `ShopifyDraftOrderBuilder` - Input/output validation
- `priceCalculator` - Edge cases

### 8.2 Integration Tests
- End-to-end: Create Draft Order → Verify Shopify response
- Multi-product: Add item → Update Draft Order

---

## 9. Deployment

```bash
# 1. Database migration
npx prisma migrate deploy

# 2. Build API
cd apps/api
npm run build

# 3. Deploy (Docker Compose)
docker-compose up -d api

# 4. Health check
curl https://app.teszt.uk/api/health
```

---

## 10. Documentation

### 10.1 API Documentation (Swagger)
- Auto-generated via NestJS `@nestjs/swagger`
- Available at: `https://app.teszt.uk/api/docs`

---

## Document Metadata

- **Version:** 1.0
- **Last Updated:** 2026-01-07
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Implementation

---

## Related Documents

- **[PRD 01: Widget/Extension Modification](./01-WIDGET-EXTENSION-MODIFICATION.md)**
- **[PRD 03: Checkout Flow & Multi-Product Cart](./03-CHECKOUT-FLOW-MULTI-PRODUCT.md)**
