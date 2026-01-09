# PRD Segment 4: Testing & Deployment Strategy

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft
**Priority:** P0 (Critical)
**Dependencies:** Segments 1, 2, 3
**Part of:** Draft Orders Custom Pricing Implementation

---

## Executive Summary

This document outlines the comprehensive **testing strategy and deployment plan** for the Draft Orders custom pricing implementation. It covers unit testing, integration testing, end-to-end testing, deployment procedures, rollback strategies, and post-deployment monitoring.

**Goal:** Ensure a bug-free, performant, and reliable implementation that can be deployed to production with confidence and rolled back quickly if issues arise.

---

## 1. Testing Strategy Overview

### 1.1 Testing Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  ← User journey tests
        └─────────────┘
       ┌───────────────────┐
       │ Integration (20%) │  ← API + DB + Shopify API
       └───────────────────┘
      ┌─────────────────────────┐
      │   Unit Tests (75%)      │  ← Functions, components, services
      └─────────────────────────┘
```

### 1.2 Test Coverage Targets

| Component | Target Coverage | Measurement Tool |
|-----------|----------------|------------------|
| **Backend Services** | 80%+ | Jest coverage |
| **Frontend Components** | 70%+ | Vitest coverage |
| **Utilities** | 90%+ | Jest/Vitest |
| **Integration** | All critical paths | Manual + Playwright |
| **E2E** | Happy path + 3 edge cases | Manual + Playwright |

---

## 2. Unit Testing

### 2.1 Backend Unit Tests

#### **Test File:** `apps/api/src/domains/draft-order/services/draft-order.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DraftOrderService } from './draft-order.service';
import { ShopifyService } from '../../auth/services/shopify.service';
import { SHOP_REPOSITORY } from '../../shop/repositories/shop.repository.interface';

describe('DraftOrderService', () => {
  let service: DraftOrderService;
  let shopifyService: jest.Mocked<ShopifyService>;
  let shopRepository: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftOrderService,
        {
          provide: ShopifyService,
          useValue: {
            getRestClient: jest.fn(),
          },
        },
        {
          provide: SHOP_REPOSITORY,
          useValue: {
            findByDomain: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DraftOrderService>(DraftOrderService);
    shopifyService = module.get(ShopifyService);
    shopRepository = module.get(SHOP_REPOSITORY);
  });

  describe('createDraftOrder', () => {
    it('should create draft order with custom price', async () => {
      // Arrange
      const shopDomain = 'test-shop.myshopify.com';
      const mockShop = {
        domain: shopDomain,
        accessToken: 'mock_token',
      };

      const mockClient = {
        post: jest.fn().mockResolvedValue({
          body: {
            draft_order: {
              id: 123456,
              invoice_url: 'https://example.com/invoices/abc',
              line_items: [
                {
                  variant_id: 789,
                  title: 'Test Product',
                  quantity: 1,
                  price: '39.98',
                },
              ],
              total_price: '39.98',
              currency: 'USD',
            },
          },
        }),
      };

      shopRepository.findByDomain.mockResolvedValue(mockShop);
      shopifyService.getRestClient.mockReturnValue(mockClient);

      const dto = {
        variantId: 'gid://shopify/ProductVariant/789',
        quantity: 1,
        originalPrice: 19.99,
        customPrice: 39.98,
        productTitle: 'Test Product',
        variantTitle: 'Red / Large',
      };

      // Act
      const result = await service.createDraftOrder(shopDomain, dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.draftOrderId).toContain('DraftOrder/123456');
      expect(result.total).toBe('39.98');
      expect(mockClient.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'draft_orders',
        })
      );
    });

    it('should throw error if shop not found', async () => {
      // Arrange
      shopRepository.findByDomain.mockResolvedValue(null);

      const dto = {
        variantId: 'gid://shopify/ProductVariant/789',
        quantity: 1,
        originalPrice: 19.99,
        customPrice: 39.98,
        productTitle: 'Test Product',
        variantTitle: 'Red / Large',
      };

      // Act & Assert
      await expect(
        service.createDraftOrder('unknown-shop.myshopify.com', dto)
      ).rejects.toThrow('Shop not found');
    });

    it('should handle Shopify API errors gracefully', async () => {
      // Arrange
      const mockShop = {
        domain: 'test-shop.myshopify.com',
        accessToken: 'mock_token',
      };

      const mockClient = {
        post: jest.fn().mockRejectedValue(new Error('Shopify API error')),
      };

      shopRepository.findByDomain.mockResolvedValue(mockShop);
      shopifyService.getRestClient.mockReturnValue(mockClient);

      const dto = {
        variantId: 'gid://shopify/ProductVariant/789',
        quantity: 1,
        originalPrice: 19.99,
        customPrice: 39.98,
        productTitle: 'Test Product',
        variantTitle: 'Red / Large',
      };

      // Act & Assert
      await expect(
        service.createDraftOrder('test-shop.myshopify.com', dto)
      ).rejects.toThrow('Failed to create draft order');
    });
  });

  describe('addItemToDraftOrder', () => {
    it('should add item to existing draft order', async () => {
      // Test implementation...
    });

    it('should throw 404 if draft order not found', async () => {
      // Test implementation...
    });
  });
});
```

#### **Test File:** `apps/api/src/domains/draft-order/utils/price-calculator.spec.ts`

```typescript
import { calculateCustomPrice } from './price-calculator';

describe('priceCalculator', () => {
  describe('calculateCustomPrice', () => {
    it('should calculate 2x price correctly', () => {
      expect(calculateCustomPrice(19.99, 2)).toBe(39.98);
      expect(calculateCustomPrice(10.00, 2)).toBe(20.00);
      expect(calculateCustomPrice(5.55, 2)).toBe(11.10);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCustomPrice(10.333, 2)).toBe(20.67);
      expect(calculateCustomPrice(9.999, 2)).toBe(20.00);
    });

    it('should handle edge cases', () => {
      expect(calculateCustomPrice(0.01, 2)).toBe(0.02);
      expect(calculateCustomPrice(999.99, 2)).toBe(1999.98);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateCustomPrice(0, 2)).toThrow('Invalid original price');
      expect(() => calculateCustomPrice(-10, 2)).toThrow('Invalid original price');
      expect(() => calculateCustomPrice(10, 0)).toThrow('Invalid multiplier');
      expect(() => calculateCustomPrice(10, -2)).toThrow('Invalid multiplier');
    });
  });
});
```

### 2.2 Frontend Unit Tests

#### **Test File:** `extensions/priceflow-widget/src/utils/priceCalculator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCustomPrice, formatPrice } from './priceCalculator';

describe('priceCalculator', () => {
  it('calculates 2x price correctly', () => {
    expect(calculateCustomPrice(19.99, 2)).toBe(39.98);
  });

  it('throws error for invalid inputs', () => {
    expect(() => calculateCustomPrice(-10, 2)).toThrow();
    expect(() => calculateCustomPrice(10, -2)).toThrow();
  });
});

describe('formatPrice', () => {
  it('formats USD price correctly', () => {
    expect(formatPrice(39.98, 'USD')).toBe('$39.98');
    expect(formatPrice(100, 'USD')).toBe('$100.00');
  });

  it('formats EUR price correctly', () => {
    expect(formatPrice(39.98, 'EUR')).toBe('€39.98');
  });
});
```

#### **Test File:** `extensions/priceflow-widget/src/hooks/useSession.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useSession } from './useSession';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('useSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should load session from sessionStorage', () => {
    const mockSession = {
      draftOrderId: 'gid://shopify/DraftOrder/123',
      shopDomain: 'test-shop.myshopify.com',
      invoiceUrl: 'https://example.com/invoices/abc',
      itemsCount: 1,
      totalPrice: '39.98',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    sessionStorage.setItem('priceflow_draft_order_session', JSON.stringify(mockSession));

    const { result } = renderHook(() => useSession());

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.hasActiveSession).toBe(true);
  });

  it('should save session to sessionStorage', () => {
    const { result } = renderHook(() => useSession());

    const newSession = {
      draftOrderId: 'gid://shopify/DraftOrder/456',
      shopDomain: 'test-shop.myshopify.com',
      invoiceUrl: 'https://example.com/invoices/def',
      itemsCount: 2,
      totalPrice: '79.96',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    act(() => {
      result.current.saveSession(newSession);
    });

    expect(result.current.session).toEqual(newSession);

    const stored = JSON.parse(sessionStorage.getItem('priceflow_draft_order_session')!);
    expect(stored.draftOrderId).toBe('gid://shopify/DraftOrder/456');
  });

  it('should clear expired session', () => {
    const expiredSession = {
      draftOrderId: 'gid://shopify/DraftOrder/789',
      shopDomain: 'test-shop.myshopify.com',
      invoiceUrl: 'https://example.com/invoices/ghi',
      itemsCount: 1,
      totalPrice: '39.98',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
    };

    sessionStorage.setItem('priceflow_draft_order_session', JSON.stringify(expiredSession));

    const { result } = renderHook(() => useSession());

    expect(result.current.hasActiveSession).toBe(false);
    expect(result.current.session).toBeNull();
  });
});
```

---

## 3. Integration Testing

### 3.1 API Integration Tests

#### **Test File:** `apps/api/test/integration/draft-order.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/domains/common/database/prisma.service';

describe('Draft Order API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.draftOrderSession.deleteMany();
  });

  describe('POST /api/draft-orders/create', () => {
    it('should create draft order successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/draft-orders/create')
        .set('X-Shopify-Shop', 'test-shop.myshopify.com')
        .send({
          variantId: 'gid://shopify/ProductVariant/123',
          quantity: 1,
          originalPrice: 19.99,
          customPrice: 39.98,
          productTitle: 'Test Product',
          variantTitle: 'Red / Large',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.draftOrderId).toBeDefined();
      expect(response.body.invoiceUrl).toContain('invoices');
    });

    it('should return 401 if shop not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/draft-orders/create')
        .set('X-Shopify-Shop', 'unknown-shop.myshopify.com')
        .send({
          variantId: 'gid://shopify/ProductVariant/123',
          quantity: 1,
          originalPrice: 19.99,
          customPrice: 39.98,
          productTitle: 'Test Product',
          variantTitle: 'Red / Large',
        })
        .expect(401);
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/draft-orders/create')
        .set('X-Shopify-Shop', 'test-shop.myshopify.com')
        .send({
          variantId: '', // Invalid
          quantity: -1, // Invalid
          originalPrice: 0, // Invalid
          customPrice: 39.98,
          productTitle: '',
          variantTitle: '',
        })
        .expect(400);
    });
  });

  describe('POST /api/draft-orders/:id/add-item', () => {
    it('should add item to existing draft order', async () => {
      // First, create a draft order
      const createResponse = await request(app.getHttpServer())
        .post('/api/draft-orders/create')
        .set('X-Shopify-Shop', 'test-shop.myshopify.com')
        .send({
          variantId: 'gid://shopify/ProductVariant/123',
          quantity: 1,
          originalPrice: 19.99,
          customPrice: 39.98,
          productTitle: 'Test Product',
          variantTitle: 'Red / Large',
        });

      const draftOrderId = createResponse.body.draftOrderId;

      // Then, add another item
      const addResponse = await request(app.getHttpServer())
        .post(`/api/draft-orders/${draftOrderId}/add-item`)
        .set('X-Shopify-Shop', 'test-shop.myshopify.com')
        .send({
          variantId: 'gid://shopify/ProductVariant/456',
          quantity: 2,
          originalPrice: 29.99,
          customPrice: 59.98,
          productTitle: 'Another Product',
          variantTitle: 'Blue / Medium',
        })
        .expect(200);

      expect(addResponse.body.lineItems.length).toBe(2);
      expect(addResponse.body.total).toBe('159.94'); // 39.98 + 2*59.98
    });
  });
});
```

---

## 4. End-to-End Testing

### 4.1 E2E Test Scenarios

#### **Test Suite:** Playwright E2E Tests

**File:** `e2e/draft-orders.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Draft Orders - Custom Pricing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to product page
    await page.goto('https://test-shop.myshopify.com/products/test-product');
  });

  test('should add single product with 2x price and checkout', async ({ page }) => {
    // 1. Click custom Add to Cart button
    await page.click('button:has-text("Add to Cart (2x Price)")');

    // 2. Wait for API call to complete
    await page.waitForSelector('button:has-text("Checkout Now")');

    // 3. Verify success message
    await expect(page.locator('text=Product added to cart!')).toBeVisible();

    // 4. Click "Checkout Now"
    await page.click('button:has-text("Checkout Now")');

    // 5. Verify redirect to Shopify checkout
    await page.waitForURL(/.*invoices.*/);
    await expect(page.url()).toContain('invoices');

    // 6. Verify price is 2x in checkout
    const priceElement = page.locator('.order-summary__section--total-lines');
    await expect(priceElement).toContainText('$39.98');
  });

  test('should add multiple products to same draft order', async ({ page, context }) => {
    // 1. Add first product
    await page.click('button:has-text("Add to Cart (2x Price)")');
    await page.waitForSelector('text=Product added to cart!');

    // 2. Click "Continue Shopping"
    await page.click('button:has-text("Continue Shopping")');

    // 3. Navigate to second product
    await page.goto('https://test-shop.myshopify.com/products/another-product');

    // 4. Add second product
    await page.click('button:has-text("Add to Cart (2x Price)")');
    await page.waitForSelector('text=2 items in cart');

    // 5. Verify cart status shows 2 items
    await expect(page.locator('text=🛒 2 items in cart')).toBeVisible();

    // 6. Checkout
    await page.click('button:has-text("Proceed to Checkout")');

    // 7. Verify both products in checkout
    await page.waitForURL(/.*invoices.*/);
    const lineItems = page.locator('.product__description');
    await expect(lineItems).toHaveCount(2);
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // 1. Mock expired session in sessionStorage
    await page.evaluate(() => {
      const expiredSession = {
        draftOrderId: 'gid://shopify/DraftOrder/123',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };
      sessionStorage.setItem('priceflow_draft_order_session', JSON.stringify(expiredSession));
    });

    // 2. Click Add to Cart
    await page.click('button:has-text("Add to Cart (2x Price)")');

    // 3. Verify new draft order is created (not added to expired one)
    await page.waitForSelector('button:has-text("Checkout Now")');

    // 4. Verify sessionStorage updated with new session
    const newSession = await page.evaluate(() => {
      return JSON.parse(sessionStorage.getItem('priceflow_draft_order_session')!);
    });
    expect(new Date(newSession.expiresAt)).toBeGreaterThan(new Date());
  });

  test('should display error on API failure', async ({ page, context }) => {
    // 1. Mock API error
    await context.route('**/api/draft-orders/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    // 2. Click Add to Cart
    await page.click('button:has-text("Add to Cart (2x Price)")');

    // 3. Verify error message displayed
    await expect(page.locator('text=Something went wrong')).toBeVisible();

    // 4. Verify retry button appears
    await expect(page.locator('button:has-text("Retry"))).toBeVisible();
  });
});
```

---

## 5. Manual Testing Checklist

### 5.1 Pre-Deployment Checklist

**Environment:** Development Store

- [ ] **Widget displays correctly**
  - [ ] Custom Add to Cart button renders
  - [ ] Price transparency card shows 2x price
  - [ ] Quantity selector works
  - [ ] Loading state displays during API call

- [ ] **Single product purchase**
  - [ ] Click "Add to Cart" → API call succeeds
  - [ ] Redirect to checkout URL
  - [ ] Checkout shows correct 2x price
  - [ ] Complete payment → Order created
  - [ ] Verify order in Shopify Admin

- [ ] **Multi-product purchase**
  - [ ] Add Product A → Session created
  - [ ] Continue shopping → Navigate to Product B
  - [ ] Add Product B → Session updated
  - [ ] Checkout shows both products
  - [ ] Complete payment → Order with 2 products

- [ ] **Error handling**
  - [ ] Disconnect internet → Error message displayed
  - [ ] Invalid variant → Error message displayed
  - [ ] Shop not authenticated → 401 error

- [ ] **Session management**
  - [ ] SessionStorage persists across page navigations
  - [ ] Session expires after 24 hours (mock time)
  - [ ] Session cleared after order completion

- [ ] **Mobile responsive**
  - [ ] Test on iPhone (iOS Safari)
  - [ ] Test on Android (Chrome)
  - [ ] Button layout correct on mobile
  - [ ] Price card responsive

- [ ] **Browser compatibility**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

---

## 6. Performance Testing

### 6.1 Load Testing (Backend API)

**Tool:** Artillery or k6

**Test Script:** `load-test/draft-orders.yml`

```yaml
config:
  target: "https://app.teszt.uk"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests per second
    - duration: 120
      arrivalRate: 50 # Ramp up to 50 req/s
  http:
    headers:
      X-Shopify-Shop: "test-shop.myshopify.com"

scenarios:
  - name: "Create Draft Order"
    flow:
      - post:
          url: "/api/draft-orders/create"
          json:
            variantId: "gid://shopify/ProductVariant/123"
            quantity: 1
            originalPrice: 19.99
            customPrice: 39.98
            productTitle: "Load Test Product"
            variantTitle: "Red / Large"
```

**Run:** `artillery run load-test/draft-orders.yml`

**Success Criteria:**
- p95 response time < 500ms
- Error rate < 1%
- Throughput > 40 req/s

---

## 7. Deployment Strategy

### 7.1 Deployment Phases

#### **Phase 1: Development Environment**
```bash
# 1. Database migration
cd apps/api
npx prisma migrate dev --name add-draft-order-session

# 2. Build backend
npm run build

# 3. Build extension
cd ../../extensions/priceflow-widget
npm run build

# 4. Deploy extension
shopify app deploy

# 5. Start Docker Compose
cd ../..
docker-compose up -d
```

#### **Phase 2: Staging Environment**
```bash
# 1. Merge to staging branch
git checkout staging
git merge feature/draft-orders

# 2. Deploy to staging server
./deploy-staging.sh

# 3. Run smoke tests
npm run test:e2e:staging
```

#### **Phase 3: Production Deployment**
```bash
# 1. Merge to main
git checkout main
git merge staging

# 2. Create release tag
git tag -a v1.0.0 -m "Draft Orders custom pricing release"

# 3. Deploy backend
./deploy-production.sh

# 4. Deploy extension
cd extensions/priceflow-widget
shopify app deploy --env production

# 5. Enable extension in Partner Dashboard
# (Manual step: Publish extension to merchants)
```

### 7.2 Rollback Plan

**If critical issue discovered in production:**

```bash
# 1. Revert extension (Partner Dashboard)
# Unpublish extension → Merchants revert to native Add to Cart

# 2. Rollback backend deployment
git revert HEAD
git push origin main
./deploy-production.sh

# 3. Rollback database migration (if needed)
cd apps/api
npx prisma migrate resolve --rolled-back [migration-name]
```

### 7.3 Feature Flag (Optional)

**Environment Variable:** `ENABLE_DRAFT_ORDERS=true`

**Backend:**
```typescript
if (process.env.ENABLE_DRAFT_ORDERS !== 'true') {
  throw new Error('Draft Orders feature is disabled');
}
```

**Frontend:**
```typescript
if (import.meta.env.VITE_ENABLE_DRAFT_ORDERS !== 'true') {
  return <NativeAddToCartButton />;
}
```

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track (Production)

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| **API Error Rate** | Datadog/New Relic | > 1% |
| **API Response Time (p95)** | Datadog | > 1 second |
| **Draft Order Creation Success Rate** | Custom dashboard | < 98% |
| **Session Expiration Rate** | Custom dashboard | > 10% |
| **Checkout Completion Rate** | Shopify Analytics | < 70% |

### 8.2 Logging

**Backend logging:**
```typescript
// Log all Draft Order operations
console.log('[DraftOrderService] Creating draft order:', {
  shopDomain,
  variantId,
  customPrice,
  timestamp: new Date().toISOString(),
});
```

**Log aggregation:** Ship logs to:
- **Datadog Logs** (cloud)
- **Papertrail** (alternative)
- **ELK Stack** (self-hosted)

### 8.3 Alerts

**Critical alerts (PagerDuty/Slack):**
1. Draft Order API error rate > 5% (5 minutes)
2. Shopify API rate limit exceeded
3. Database connection failures
4. Extension load failures > 10%

**Warning alerts (Slack only):**
1. Session expiration rate > 10% (1 hour)
2. API response time p95 > 800ms (15 minutes)
3. Checkout abandonment rate > 30%

---

## 9. Post-Deployment Validation

### 9.1 Smoke Tests (Production)

**Within 10 minutes of deployment:**

1. [ ] Health check: `curl https://app.teszt.uk/api/health` → 200 OK
2. [ ] Extension loads on product page
3. [ ] Test purchase (single product) → Order created
4. [ ] Verify order in Shopify Admin → 2x price applied
5. [ ] Check logs: No errors in last 10 minutes
6. [ ] Check metrics: API response time < 500ms

### 9.2 User Acceptance Testing (UAT)

**Merchant test:**
1. Install extension in test store
2. Configure settings (enable widget, set multiplier)
3. Add product to cart
4. Complete checkout
5. Verify order in Admin

**Sign-off:** Product Manager + QA Lead

---

## 10. Documentation & Handoff

### 10.1 Runbook

**File:** `docs/runbook/DRAFT-ORDERS-RUNBOOK.md`

**Contents:**
- How to debug Draft Order API failures
- How to manually create Draft Order (Shopify Admin)
- How to investigate session issues
- Emergency contacts (on-call engineer)

### 10.2 Merchant Documentation

**Help Center Article:** "How to Use Custom Pricing with Draft Orders"

**Topics:**
- Enabling the widget extension
- Setting price multiplier
- Troubleshooting common issues
- FAQ

---

## Document Metadata

- **Version:** 1.0
- **Last Updated:** 2026-01-07
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Implementation

---

## Related Documents

- **[PRD 01: Widget/Extension Modification](./01-WIDGET-EXTENSION-MODIFICATION.md)**
- **[PRD 02: Backend Draft Orders API](./02-BACKEND-DRAFT-ORDERS-API.md)**
- **[PRD 03: Checkout Flow & Multi-Product Cart](./03-CHECKOUT-FLOW-MULTI-PRODUCT.md)**
- **[PRD Index: Overview](./00-INDEX.md)**
