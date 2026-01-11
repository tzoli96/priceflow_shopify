# Claude Code – Shopify App Project Guidelines (David's Style)

This file defines **mandatory rules** for all code generation and modifications in this Shopify app codebase.
If any rule would be violated, stop and fix the solution to fully comply with these guidelines.

---

## 0) Project Overview

This is a **Shopify App** built with a modern monorepo architecture:

**Structure:**
- **Backend API**: NestJS (`apps/api/`)
- **Storefront Frontend**: Next.js (`apps/storefront/`)
- **Admin Embed App**: Next.js (`apps/admin/`)
- **Extension**: Shopify extension (`extension/`)

**Development Environment:**
- Docker Compose orchestrates all services
- Cloudflare tunnel embedded in the extension for local development
- All apps run in containerized environment

**Architecture:**
- NestJS backend follows **Domain-Driven Design (DDD)** architecture
- TypeScript everywhere
- Monorepo structure with shared packages

---

## 1) Global Principles (always)

- **TypeScript everywhere**.
    - Next.js: TypeScript for all components, pages, API routes
    - NestJS: TypeScript for all modules, services, controllers, entities
- Prefer **many small, short functions** over a few large ones.
- **NO automated tests**:
    - Do NOT generate unit / integration / e2e tests.
    - Do NOT keep any test-related scaffolding, configs, or dependencies.
    - If a template generates them (e.g. `__tests__`, `*.spec.ts`, Jest configs, Playwright, Cypress), **delete them**.
- **Use `.env` files** for all environment variables.
    - Always provide `.env.example` (no secrets, only placeholders).
    - Never commit secrets.
- If any implementation decision or uncertainty arises, **ASK BEFORE coding**.
    - Examples: Shopify API integration patterns, webhook handling, auth flows, data models, permissions, UI flows, error handling, pagination.

---

## 2) Backend (NestJS - apps/api/) - Domain-Driven Design

**Architecture Principles:**
- Follow **Domain-Driven Design (DDD)** pattern
- Organize code by **domain/feature**, not by technical layer

**Folder Structure:**

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── <domain-name>/           # e.g., products, orders, customers
│   │   │   ├── domain/              # Domain models, entities, value objects
│   │   │   ├── application/         # Use cases, DTOs, interfaces
│   │   │   ├── infrastructure/      # Repositories, external services
│   │   │   ├── presentation/        # Controllers, GraphQL resolvers
│   │   │   └── <domain>.module.ts
│   ├── shared/                      # Shared kernel
│   │   ├── domain/                  # Base entities, value objects
│   │   ├── infrastructure/          # Database, configs, utilities
│   │   └── application/             # Shared DTOs, interfaces
│   ├── shopify/                     # Shopify-specific integrations
│   │   ├── auth/
│   │   ├── webhooks/
│   │   └── api-client/
│   └── main.ts
```

**NestJS Conventions:**
- Each domain is a **self-contained module**
- Use NestJS dependency injection consistently
- Keep controllers thin (only routing + validation)
- Business logic lives in **application services** (use cases)
- Data access via **repositories** in infrastructure layer
- Use DTOs with **class-validator** for validation
- Use **Zod** for runtime validation where class-validator is insufficient

**Shopify Integration:**
- Shopify API client in `shopify/api-client/`
- Webhook handlers in `shopify/webhooks/`
- OAuth flow in `shopify/auth/`

---

## 3) Frontend Apps (Next.js)

### 3.1) Admin Embed App (apps/admin/)

**Purpose:** Embedded admin interface for merchants

**Stack:**
- Next.js (App Router preferred)
- Shopify Polaris for UI components
- Tailwind CSS for custom styling
- React Server Components where applicable

**Folder Structure:**
```
apps/admin/
├── app/                    # Next.js App Router
│   ├── (authenticated)/   # Authenticated routes
│   ├── api/               # API routes (proxy to backend)
│   └── layout.tsx
├── components/
│   ├── features/          # Feature-specific components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── shopify/           # Shopify App Bridge setup
│   ├── api/               # API client for backend
│   └── utils/
└── hooks/                 # Custom React hooks
```

**Conventions:**
- Use **Shopify Polaris** components as primary UI library
- Integrate **Shopify App Bridge** for embedded app experience
- Keep pages thin, move logic to hooks/lib
- API routes should proxy to backend API

### 3.2) Storefront Frontend (apps/storefront/)

**Purpose:** Customer-facing storefront

**Stack:**
- Next.js (App Router)
- Tailwind CSS
- Shopify Storefront API integration
- React Server Components for performance

**Folder Structure:**
```
apps/storefront/
├── app/
│   ├── products/
│   ├── cart/
│   └── checkout/
├── components/
│   ├── product/
│   ├── cart/
│   └── ui/
├── lib/
│   ├── shopify/           # Storefront API client
│   └── utils/
└── hooks/
```

**Conventions:**
- Use **Shopify Storefront API** for product data
- Optimize for performance (ISR, SSG where applicable)
- Mobile-first responsive design
- Keep components small and focused

### 3.3) Common Next.js Rules

- **TypeScript everywhere**: All components, pages, API routes
- **Tailwind CSS**: Write as little custom CSS as possible
- **No localStorage**: Use cookies/session for persistence
- **Zod validation**: Validate all forms and API inputs
- **Environment variables**: Use `.env.local` and Next.js env conventions

---

## 4) Extension (extension/)

**Purpose:** Shopify extension (theme app extension, checkout UI extension, etc.)

**Structure:**
```
extension/
├── blocks/                # Liquid/React blocks
├── assets/               # Static assets
├── locales/              # Translations
└── shopify.extension.toml
```

**Cloudflare Tunnel Integration:**
- Cloudflare tunnel configuration embedded in extension
- Enables local development with HTTPS
- Tunnel config in `extension/cloudflare/`

**Conventions:**
- Follow Shopify extension best practices
- Keep extension logic minimal
- Communicate with backend API for complex operations

---

## 5) Docker Compose Development

**Development Environment:**
- All services run via Docker Compose
- Each app has its own Dockerfile
- Shared volumes for hot reloading
- Cloudflare tunnel service for HTTPS

**Structure:**
```
docker-compose.yml
├── api (NestJS backend)
├── admin (Next.js admin app)
├── storefront (Next.js storefront)
└── cloudflared (Cloudflare tunnel)
```

**Commands:**
- `docker-compose up` - Start all services
- `docker-compose down` - Stop all services
- `docker-compose logs <service>` - View service logs

---

## 6) Styling Rules (Tailwind)

- Write **as little custom CSS as possible**.
- Prefer Tailwind utilities everywhere.
- For admin app: **Shopify Polaris takes precedence**, use Tailwind only for custom components
- For storefront: Tailwind-first approach
- Apply a **global Tailwind theme**:
    - adjust `tailwind.config.*` for colors, spacing, fonts, etc.
    - avoid scattered CSS overrides in components.

---

## 7) Validation (Zod + class-validator)

- **NestJS Backend**: Use `class-validator` decorators for DTOs
- **Next.js Frontend**: Use **Zod** for:
    - validating form inputs before sending requests
    - validating API responses
    - validating env variables
- Error messages must be **clear and user-friendly**.

---

## 8) Environment Variables

**Backend (NestJS):**
```
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
DATABASE_URL=
API_PORT=3000
```

**Admin App:**
```
NEXT_PUBLIC_SHOPIFY_API_KEY=
NEXT_PUBLIC_API_URL=
SHOPIFY_APP_URL=
```

**Storefront:**
```
NEXT_PUBLIC_SHOPIFY_DOMAIN=
NEXT_PUBLIC_STOREFRONT_API_TOKEN=
NEXT_PUBLIC_API_URL=
```

- Always provide `.env.example` files
- Use proper env loading in Docker Compose
- Never commit secrets

---

## 9) Monorepo & Shared Code

**Structure:**
```
packages/
├── shared/               # Shared types, utilities
├── shopify-types/       # Shopify TypeScript types
└── config/              # Shared configs (ESLint, TypeScript, Tailwind)
```

**Conventions:**
- Share TypeScript types between frontend and backend
- Keep shared code minimal and well-documented
- Use workspace features (npm/yarn/pnpm workspaces)

---

## 10) Shopify-Specific Rules

**API Integration:**
- Use official `@shopify/shopify-api` package
- Handle API rate limits gracefully
- Implement retry logic for failed requests

**Webhooks:**
- Verify webhook signatures
- Process webhooks asynchronously (queue-based)
- Handle webhook failures with dead letter queue

**OAuth:**
- Implement proper OAuth flow
- Store access tokens securely
- Handle token refresh

**Session Storage:**
- Use database for session storage (not memory)
- Implement proper session cleanup

---

## 11) README (mandatory)

- Include a `README.md` that lists:
    - **Architecture overview** (apps, structure)
    - **Setup instructions** (Docker Compose, env vars)
    - **Development workflow**
    - **Key features** in bullet points
- Keep it updated whenever architecture or features change.

---

## 12) Workflow Rules (mandatory before coding)

For every task:

1. Describe in **3–7 bullet points** what will be created or changed
    - Which app(s) affected (api/admin/storefront/extension)
    - Files, routes, components, modules, services
    - Domain/feature affected
2. If any decision point exists, **stop and ask for clarification before implementation**.
3. After implementation:
    - Remove all test-related artifacts.
    - Verify folder structure (domain organization for backend, component structure for frontend).
    - Update the README if architecture changed.
    - Verify `.env.example` completeness (placeholders only).

---

## 13) Agent State Management

**IMPORTANT:** Agent state is stored in the repository, NOT in the conversation.

**State File Location:**
```
docs/agent/STATE.md
```

**Purpose:**
- Persist agent's working context across sessions
- Track current tasks, decisions, and progress
- Enable continuation of work later without losing context
- Document implementation decisions and reasoning

**Rules:**
1. **ALWAYS read `docs/agent/STATE.md` at the start of a new session**
2. **ALWAYS update `docs/agent/STATE.md` when:**
   - Starting a new task
   - Making architectural decisions
   - Completing a milestone
   - Encountering blockers
   - Changing implementation approach
3. **State file format:**
   - Current task(s) and status
   - Recent changes and decisions
   - Open questions or blockers
   - Next steps
   - Implementation notes

**Example workflow:**
```
1. New session starts
2. Read docs/agent/STATE.md to understand current state
3. Continue work from where it was left off
4. Update STATE.md with progress
5. Session ends → state persisted for next time
```

**Benefits:**
- No context loss between sessions
- Clear audit trail of decisions
- Easy to resume work after days/weeks
- Multiple agents can coordinate via shared state

---

## 14) Forbidden / Avoid

- Any testing frameworks/configs/files (Jest/Vitest/Cypress/Playwright).
- Random global CSS without Tailwind-first or Polaris-first justification.
- Unstructured logic in controllers/pages (move to services/hooks/utils).
- Secret values in repo files.
- Breaking DDD principles in NestJS backend (mixing layers, fat controllers).
- Ignoring Shopify best practices and rate limits.

---