# PRD Master Index: Draft Orders Custom Pricing Implementation

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft
**Project:** PriceFlow - Custom Pricing for Non-Plus Shopify Stores

---

## Executive Summary

This is the **master index** for the Draft Orders custom pricing implementation, a solution enabling **2x product pricing** on Shopify stores **without requiring Shopify Plus**. The implementation consists of 4 interconnected segments, each documented in detail.

### Quick Links

- **[Segment 1: Widget/Extension Modification](./01-WIDGET-EXTENSION-MODIFICATION.md)**
- **[Segment 2: Backend Draft Orders API](./02-BACKEND-DRAFT-ORDERS-API.md)**
- **[Segment 3: Checkout Flow & Multi-Product Cart](./03-CHECKOUT-FLOW-MULTI-PRODUCT.md)**
- **[Segment 4: Testing & Deployment](./04-TESTING-DEPLOYMENT.md)**

---

## 1. Problem Statement

### The Challenge

Shopify's **Cart Transform Functions** (the standard way to modify cart prices) **only work on Shopify Plus** for custom apps. Merchants on Basic, Standard, or Advanced plans cannot programmatically change product prices in the cart and checkout.

**Requirements:**
1. ✅ Enable **2x pricing** (or custom multiplier) on products
2. ✅ Support **multiple products** in a single cart session
3. ✅ Custom prices **must persist through checkout** to final order
4. ✅ Works on **non-Plus Shopify plans** (Basic/Standard/Advanced)

### The Solution: Draft Orders API

Shopify's **Draft Orders API** allows creating orders with custom pricing on **any plan**. Our implementation:

1. **Replaces** the native Add to Cart button with a custom widget
2. **Creates** a Draft Order (via backend API) with 2x pricing when clicked
3. **Redirects** the customer to the Draft Order checkout URL
4. **Supports** multi-product sessions (sessionStorage tracking)
5. **Completes** checkout → Order created with custom prices ✅

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                         │
└─────────────────────────────────────────────────────────────┘

Product Page → Custom Widget → Backend API → Shopify Draft Order
     │              │               │                │
     │              │               │                │
     ↓              ↓               ↓                ↓
  [Segment 1]   [Segment 1]    [Segment 2]      [Segment 2]
   Widget UI     React Hook      NestJS API    Draft Order
                                               Creation

                                    ↓
                            ┌──────────────────┐
                            │  SessionStorage  │  ← [Segment 3]
                            │  (Multi-product) │     Session Mgmt
                            └──────────────────┘
                                    ↓
                            ┌──────────────────┐
                            │ Checkout URL     │  ← [Segment 3]
                            │ (Invoice)        │     Redirect
                            └──────────────────┘
                                    ↓
                            ┌──────────────────┐
                            │ Order Complete   │
                            │ (2x Price ✅)    │
                            └──────────────────┘

                            [Segment 4] Testing & Deployment
```

---

## 3. Segment Breakdown

### **Segment 1: Widget/Extension Modification**
**File:** [01-WIDGET-EXTENSION-MODIFICATION.md](./01-WIDGET-EXTENSION-MODIFICATION.md)

**Scope:**
- Storefront extension (React component)
- Custom "Add to Cart (2x Price)" button
- Price transparency display
- Loading states and error handling
- API communication hook

**Key Deliverables:**
- `extensions/priceflow-widget/src/components/AddToCartButton.tsx`
- `extensions/priceflow-widget/src/hooks/useDraftOrder.ts`
- `extensions/priceflow-widget/shopify.extension.toml`

**Dependencies:** None (can start immediately)

**Estimated Effort:** 3-5 days

---

### **Segment 2: Backend Draft Orders API**
**File:** [02-BACKEND-DRAFT-ORDERS-API.md](./02-BACKEND-DRAFT-ORDERS-API.md)

**Scope:**
- NestJS backend API endpoints
- Shopify Admin API integration (Draft Orders)
- Business logic and validation
- Database schema (Draft Order session tracking)
- Error handling and retry logic

**Key Deliverables:**
- `apps/api/src/domains/draft-order/controllers/draft-order.controller.ts`
- `apps/api/src/domains/draft-order/services/draft-order.service.ts`
- `apps/api/prisma/schema.prisma` (DraftOrderSession model)
- API endpoints:
  - `POST /api/draft-orders/create`
  - `POST /api/draft-orders/:id/add-item`
  - `GET /api/draft-orders/:id`
  - `DELETE /api/draft-orders/:id`

**Dependencies:** Shop authentication (already implemented)

**Estimated Effort:** 5-7 days

---

### **Segment 3: Checkout Flow & Multi-Product Cart**
**File:** [03-CHECKOUT-FLOW-MULTI-PRODUCT.md](./03-CHECKOUT-FLOW-MULTI-PRODUCT.md)

**Scope:**
- SessionStorage-based session management
- Multi-product addition workflow
- Cart status display widget
- Checkout redirect logic
- Session expiration handling
- Order completion and cleanup

**Key Deliverables:**
- `extensions/priceflow-widget/src/hooks/useSession.ts`
- `extensions/priceflow-widget/src/components/CartStatus.tsx`
- SessionStorage management logic
- "Continue Shopping" vs "Checkout Now" flow

**Dependencies:** Segment 1 (Widget), Segment 2 (Backend API)

**Estimated Effort:** 3-4 days

---

### **Segment 4: Testing & Deployment**
**File:** [04-TESTING-DEPLOYMENT.md](./04-TESTING-DEPLOYMENT.md)

**Scope:**
- Unit tests (backend + frontend)
- Integration tests (API + Shopify)
- End-to-end tests (Playwright)
- Manual testing checklist
- Performance testing (load tests)
- Deployment strategy (dev → staging → production)
- Monitoring and alerting setup
- Rollback plan

**Key Deliverables:**
- Jest/Vitest test suites
- Playwright E2E test scripts
- Deployment scripts (`deploy-production.sh`)
- Runbook for operations team
- Merchant documentation

**Dependencies:** Segments 1, 2, 3 (all features complete)

**Estimated Effort:** 4-6 days (parallel with development)

---

## 4. Implementation Timeline

### Recommended Phases

```
Week 1:
├─ Day 1-2: Segment 1 (Widget) - UI components
├─ Day 3-5: Segment 2 (Backend API) - Basic endpoints
└─ Day 6-7: Segment 2 (Backend API) - Error handling & tests

Week 2:
├─ Day 1-2: Segment 3 (Multi-product) - Session management
├─ Day 3-4: Segment 3 (Multi-product) - Cart status widget
└─ Day 5-7: Integration testing + bug fixes

Week 3:
├─ Day 1-3: Segment 4 (Testing) - E2E tests + manual QA
├─ Day 4: Staging deployment + UAT
└─ Day 5: Production deployment + monitoring

Total: ~15-18 days (3 weeks)
```

### Parallel Workstreams

**Frontend Developer:**
- Week 1: Segment 1 (Widget)
- Week 2: Segment 3 (Multi-product UI)
- Week 3: E2E tests + bug fixes

**Backend Developer:**
- Week 1: Segment 2 (Draft Orders API)
- Week 2: Segment 3 (Session backend support)
- Week 3: Performance tests + deployment

**QA Engineer:**
- Week 1-2: Write test plans (Segment 4)
- Week 2: Integration testing
- Week 3: Manual QA + E2E validation

---

## 5. Technical Stack

### Frontend (Extension)
- **Framework:** React (Shopify UI Extensions)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Testing:** Vitest + React Testing Library
- **State Management:** React Hooks (useState, useEffect)
- **Storage:** SessionStorage

### Backend (API)
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Testing:** Jest + Supertest
- **API Client:** Shopify Admin REST API (@shopify/shopify-api)
- **Authentication:** OAuth 2.0 (already implemented)

### Infrastructure
- **Hosting:** Docker Compose (dev/staging), AWS/GCP (production)
- **Database:** PostgreSQL 14+
- **Monitoring:** Datadog / New Relic
- **CI/CD:** GitHub Actions

---

## 6. Success Criteria

### Functional Requirements

| Requirement | Success Metric |
|-------------|----------------|
| **Custom pricing works** | ✅ Product in order has 2x price |
| **Multi-product support** | ✅ 2+ products in single Draft Order |
| **Checkout completion** | ✅ Customer can complete payment |
| **Session persistence** | ✅ Cart survives page navigation |
| **No Shopify Plus required** | ✅ Works on Basic/Standard/Advanced |

### Performance Requirements

| Metric | Target |
|--------|--------|
| **Widget load time** | < 100ms |
| **API response time (p95)** | < 500ms |
| **Checkout redirect time** | < 2 seconds |
| **Test coverage** | > 75% (backend + frontend) |

### Business Requirements

| Metric | Target |
|--------|--------|
| **Merchant adoption rate** | > 80% enable widget |
| **Customer checkout completion** | > 70% complete payment |
| **Support tickets** | < 5 per week |
| **Uptime** | > 99.5% |

---

## 7. Risk Assessment

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Shopify API rate limits** | HIGH | Implement retry logic with exponential backoff |
| **Draft Order invoice expires** | MEDIUM | 24h expiration + auto-cleanup |
| **SessionStorage cleared (browser close)** | LOW | Expected behavior, document for merchants |
| **Network failure during API call** | MEDIUM | Error handling + retry button |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Merchants prefer native cart** | HIGH | Provide toggle to disable custom widget |
| **Checkout abandonment increases** | MEDIUM | Monitor metrics + UX improvements |
| **Shopify policy violation** | LOW | Draft Orders are officially supported API |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Backend downtime** | HIGH | Health checks + auto-restart |
| **Database connection failures** | HIGH | Connection pooling + failover |
| **Extension deployment failures** | MEDIUM | Rollback plan + feature flags |

---

## 8. Dependencies

### External Dependencies

1. **Shopify Admin API** (Draft Orders endpoint)
   - API version: 2024-10+
   - Required scopes: `write_draft_orders`, `read_products`

2. **Shopify OAuth** (already implemented)
   - App must be installed in shop
   - Valid access token in database

3. **PostgreSQL Database**
   - Version: 14+
   - Required for session tracking

### Internal Dependencies

1. **Shop authentication** (already implemented)
   - `X-Shopify-Shop` header interceptor
   - Shop model and repository

2. **Shopify service** (already implemented)
   - REST client factory
   - API key from LocalStack Secrets

---

## 9. Communication Plan

### Stakeholders

| Role | Responsibility | Communication Frequency |
|------|---------------|------------------------|
| **Product Manager** | Requirements, prioritization | Daily standups |
| **Tech Lead** | Architecture, code review | Daily |
| **Frontend Engineer** | Widget implementation | Daily |
| **Backend Engineer** | API implementation | Daily |
| **QA Engineer** | Testing, validation | Daily + weekly report |
| **Merchant Success** | User feedback, support | Weekly updates |

### Status Updates

**Format:** Weekly status report (every Friday)

**Template:**
```
## Week X Update: Draft Orders Implementation

### Completed:
- [x] Segment 1: Widget UI complete
- [x] Segment 2: API endpoints implemented

### In Progress:
- [ ] Segment 3: Multi-product session management (60% done)

### Blockers:
- None currently

### Next Week:
- Complete Segment 3
- Start integration testing
```

---

## 10. Documentation & Knowledge Transfer

### Technical Documentation

1. **API Documentation** (auto-generated)
   - Swagger UI: `https://app.teszt.uk/api/docs`

2. **Architecture Diagrams**
   - Sequence diagrams (user journey)
   - Database schema (ERD)

3. **Runbook** (operations)
   - Debugging guide
   - Common issues & solutions

### Merchant Documentation

1. **Setup Guide**
   - How to enable widget extension
   - How to configure price multiplier

2. **FAQ**
   - "Why does it redirect to a different checkout?"
   - "Can I use discount codes with custom pricing?"

3. **Troubleshooting**
   - "Widget not showing up"
   - "Checkout fails to load"

---

## 11. Post-Launch Plan

### Week 1 Post-Launch

- **Daily monitoring:** Error rates, API latency, checkout completion
- **Merchant feedback:** Collect via in-app survey
- **Bug fixes:** Prioritize critical issues (P0/P1)

### Week 2-4 Post-Launch

- **Performance optimization:** Based on production metrics
- **UX improvements:** Based on user feedback
- **Documentation updates:** FAQ additions

### Month 2+

- **Feature enhancements:**
  - Product-specific multipliers (metafields)
  - Discount code compatibility
  - Mini cart drawer
- **Analytics dashboard:** Merchant-facing usage stats

---

## 12. Appendix

### Related Documents

- **[Original PRD: Shopify App Installation](../SHOPIFY_APP_INSTALLATION_PRD.md)**
- **[Claude Code Guidelines](../../claude.md)**
- **[Project README](../../README.md)**

### Glossary

| Term | Definition |
|------|------------|
| **Draft Order** | Shopify Admin API feature allowing custom pricing and manual order creation |
| **Invoice URL** | Checkout URL generated by Shopify for Draft Orders |
| **Cart Transform** | Shopify Plus feature for modifying cart (not used in this implementation) |
| **SessionStorage** | Browser storage API for tab-specific data (cleared on tab close) |
| **GID** | Global ID format used by Shopify (`gid://shopify/Resource/123`) |

---

## 13. Approval & Sign-off

### Design Review

| Aspect | Reviewer | Status | Date |
|--------|----------|--------|------|
| **Architecture** | Tech Lead | ⏳ Pending | |
| **Frontend Design** | Frontend Lead | ⏳ Pending | |
| **Backend Design** | Backend Lead | ⏳ Pending | |
| **Database Schema** | DBA | ⏳ Pending | |
| **Security** | Security Lead | ⏳ Pending | |

### Implementation Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Product Manager** | | | |
| **Tech Lead** | | | |
| **Engineering Manager** | | | |

---

## Document Metadata

- **Version:** 1.0 (Master Index)
- **Last Updated:** 2026-01-07
- **Author:** PriceFlow Engineering Team
- **Status:** Draft for Review
- **Next Review:** After all segments approved

---

## Quick Reference Card

### For Developers

```bash
# Start development
docker-compose up -d
cd extensions/priceflow-widget
npm run dev

# Run tests
npm test                    # Frontend
cd apps/api && npm test    # Backend

# Deploy
shopify app deploy         # Extension
./deploy-production.sh     # Backend
```

### For Merchants

```
1. Install PriceFlow app
2. Enable "Custom Add to Cart" widget
3. Set price multiplier (default: 2)
4. Save settings
5. Test on product page
```

### For Support Team

```
Common Issues:
1. Widget not showing → Check extension enabled
2. Price wrong in checkout → Verify multiplier setting
3. API errors → Check Shopify app installation
```

---

**End of Master Index**

**Next Step:** Review and approve each segment, then proceed with implementation in order (Segment 1 → 2 → 3 → 4).
