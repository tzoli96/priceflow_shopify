# PriceFlow Shopify - Project Status Documentation

**Last Updated:** 2025-12-21 (20:30)
**Project Name:** PriceFlow
**Version:** 0.1.0

> **IMPORTANT:** This is the ONLY official documentation for this project. We do NOT use any other documentation. All project-relevant information, changes, and status are recorded and updated here.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Docker Services](#docker-services)
4. [Docker Compose Commands](#docker-compose-commands)
5. [Ports and Endpoints](#ports-and-endpoints)
6. [Environment Variables](#environment-variables)
7. [Development Workflow](#development-workflow)
8. [Changelog](#changelog)
9. [Documentation Rules](#documentation-rules)

---

## Project Overview

PriceFlow is a Shopify application that provides price tracking and pricing functionality. The application uses microservice architecture with three main components:

- **Admin App** - Shopify embedded admin interface (Next.js)
- **Storefront App** - Shopify storefront widget (Next.js)
- **API Backend** - REST API and business logic (NestJS with DDD + Hexagonal Architecture)

---

## Architecture

### Application Components

```
priceflow_shopify/
├── apps/
│   ├── admin/          # Next.js 16.0.10 - Shopify admin embedded app
│   ├── storefront/     # Next.js 16.0.10 - Shopify storefront widget
│   └── api/            # NestJS 11 - Backend API + Prisma ORM (DDD Architecture)
│       └── src/
│           ├── domains/              # Domain-Driven Design
│           │   ├── common/           # Shared Infrastructure
│           │   │   └── database/     # Global PrismaService
│           │   └── shop/             # Shop Domain (self-contained)
│           │       ├── models/       # Domain Models
│           │       ├── dto/          # Data Transfer Objects
│           │       ├── repositories/ # Repository Pattern (Port + Adapter)
│           │       ├── services/     # Domain Services
│           │       ├── controllers/  # HTTP Controllers
│           │       └── shop.module.ts
│           ├── app.module.ts
│           └── main.ts
├── infra/
│   ├── docker/         # Dockerfiles for each service
│   ├── nginx/          # Nginx reverse proxy configuration
│   ├── cloudflared/    # Cloudflare Tunnel configuration
│   └── localstack/     # LocalStack initialization scripts
├── extensions/         # Shopify extensions (if any)
└── docker-compose.yml  # Main orchestration file
```

### Technology Stack

**Frontend (Admin & Storefront):**
- Next.js 16.0.10
- React 19.2.1
- TypeScript 5.9.3
- Tailwind CSS 4.1.18
- Shopify Polaris (admin)
- Shopify App Bridge (admin)

**Backend (API):**
- NestJS 11.0.1
- TypeScript 5.7.3
- Prisma 7.2.0 (ORM)
- PostgreSQL 16
- AWS SDK (Secrets Manager client)
- **DDD + Hexagonal Architecture**
- **Repository Pattern**
- **DTO Validation** (class-validator)

**DevOps:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Cloudflare Tunnel (expose to internet)
- LocalStack (AWS services mock)

### Backend Architecture (DDD + Hexagonal)

**Domain-Centered Structure:**
- Each domain is self-contained
- Port & Adapter pattern (Hexagonal Architecture)
- Repository interfaces (Ports) + Prisma implementations (Adapters)
- Domain Models with business logic
- DTO validation on all requests
- Global PrismaService (reusable)

**Dependency Flow:**
```
HTTP Request
    ↓
Controller (uses DTO)
    ↓
Service (orchestration)
    ↓
Repository Interface (Port)
    ↓
Repository Implementation (Adapter - Prisma)
    ↓
Domain Model (business logic)
```

---

## Docker Services

The project runs 9 Docker containers:

### 1. **admin** (Next.js)
- **Port:** 3000 (host: 3000)
- **Framework:** Next.js
- **Function:** Shopify admin embedded application
- **Hot reload:** Enabled
- **Dockerfile:** `infra/docker/admin/Dockerfile`

### 2. **storefront** (Next.js)
- **Port:** 3000 (host: 3001)
- **Framework:** Next.js
- **Function:** Shopify storefront widget
- **Hot reload:** Enabled
- **Dockerfile:** `infra/docker/storefront/Dockerfile`

### 3. **api** (NestJS)
- **Port:** 4000 (host: 4000)
- **Framework:** NestJS
- **Function:** Backend API, business logic, Prisma ORM
- **Hot reload:** Enabled
- **Dockerfile:** `infra/docker/api/Dockerfile`
- **Dependencies:** PostgreSQL (health check)
- **Architecture:** DDD + Hexagonal

### 4. **postgres**
- **Image:** postgres:16-alpine
- **Port:** 5432 (host: 5432)
- **Function:** Primary database
- **Volume:** `postgres-data` (persistent storage)
- **Health check:** `pg_isready`

### 5. **adminer**
- **Image:** ghcr.io/jeliebig/adminer-autologin
- **Port:** 8080 (host: 8080)
- **Function:** Database admin UI (auto-login)
- **Dependencies:** PostgreSQL

### 6. **localstack**
- **Image:** localstack/localstack:2.2
- **Port:** 4566 (host: 4566)
- **Function:** AWS Secrets Manager mock (development)
- **Services:** secretsmanager
- **Volume:** `localstack-data`

### 7. **localstack-init**
- **Image:** amazon/aws-cli:latest
- **Function:** LocalStack initialization (create secrets)
- **Script:** `infra/localstack/init-secrets.sh`
- **One-time run:** Stops after initialization

### 8. **nginx**
- **Image:** nginx:alpine
- **Port:** 80 (host: 8000)
- **Function:** Reverse proxy (admin, storefront, api)
- **Config:** `infra/nginx/nginx.conf`
- **Health check:** `/health` endpoint

### 9. **tunnel** (Cloudflare)
- **Image:** cloudflare/cloudflared:2024.6.1
- **Function:** Internet exposure (public URL: app.teszt.uk)
- **Config:** `infra/cloudflared/`
- **Dependencies:** Nginx health check

---

## Docker Compose Commands

### Basic Commands

```bash
# Start all services (detached mode)
docker compose up -d

# Start all services (logs visible)
docker compose up

# Start specific services only
docker compose up -d admin api postgres

# Stop all services
docker compose down

# Stop + delete volumes (data loss!)
docker compose down -v

# Restart a service
docker compose restart admin
docker compose restart api

# View logs
docker compose logs -f              # All services
docker compose logs -f admin        # Admin only
docker compose logs -f api          # API only
docker compose logs --tail=100 -f   # Last 100 lines + follow
```

### Build and Rebuild

```bash
# Rebuild images
docker compose build

# Rebuild + start
docker compose up -d --build

# Rebuild single service
docker compose build admin
docker compose up -d admin

# Full clean rebuild (no cache)
docker compose build --no-cache
```

### Enter Containers

```bash
# Enter admin container
docker exec -it admin sh

# Enter API container
docker exec -it api sh

# Enter PostgreSQL container
docker exec -it postgres psql -U priceflow_user -d priceflow

# Enter as root user
docker exec -it -u root admin sh
```

### Status and Monitoring

```bash
# List running containers
docker compose ps

# Service resource usage
docker stats

# List networks
docker network ls

# List volumes
docker volume ls
```

### Troubleshooting

```bash
# Check service health status
docker inspect postgres | grep -A 10 Health

# Detailed container info
docker inspect admin

# Follow docker events
docker compose events

# Kill frozen container
docker compose kill admin
docker compose up -d admin
```

---

## Ports and Endpoints

### Local Development (localhost)

| Service       | Port  | URL                          | Description                   |
|---------------|-------|------------------------------|-------------------------------|
| Admin App     | 3000  | http://localhost:3000        | Next.js admin app             |
| Storefront    | 3001  | http://localhost:3001        | Next.js storefront widget     |
| API           | 4000  | http://localhost:4000        | NestJS backend API            |
| PostgreSQL    | 5432  | localhost:5432               | PostgreSQL database           |
| Adminer       | 8080  | http://localhost:8080        | DB admin UI                   |
| LocalStack    | 4566  | http://localhost:4566        | AWS services mock             |
| Nginx Proxy   | 8000  | http://localhost:8000        | Reverse proxy (aggregator)    |

### API Endpoints

**Shop Domain:**
- `POST /shopify/session` - Store shop session
- `GET /shopify/session/:shop` - Get shop session
- `DELETE /shopify/session/:shop` - Deactivate shop

**System:**
- `GET /` - Health check
- `GET /secrets` - Secrets test
- `GET /db-config` - Database config

### Public URLs (Cloudflare Tunnel)

| Service       | Public URL                    |
|---------------|-------------------------------|
| Full App      | https://app.teszt.uk          |
| API           | https://app.teszt.uk/api      |

---

## Environment Variables

Environment variables are located in the `.env` file in the project root directory.

### PostgreSQL

```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=priceflow
POSTGRES_USER=priceflow_user
POSTGRES_PASSWORD=priceflow_secure_password_change_me
DATABASE_URL=postgresql://priceflow_user:priceflow_secure_password_change_me@postgres:5432/priceflow?schema=public
```

### Shopify API Credentials

```env
SHOPIFY_API_KEY=a2087c36b3d88c748e9e2339ebab5527
SHOPIFY_API_SECRET=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
SHOPIFY_ORGANIZATION_ID=4577134
SHOP_URL=priceflow-dev.myshopify.com
HOST=app.teszt.uk
API_URL=https://app.teszt.uk/api
```

### Cloudflare Tunnel

```env
TUNNEL_URL=app.teszt.uk
CLOUDFLARE_TUNNEL_TOKEN=  # To be filled!
```

### Application Configuration

```env
APP_ENV=development
EMBEDDED_APP_URL=http://localhost:3000
WIDGET_APP_URL=http://localhost:3001
BACKEND_URL=http://localhost:4000
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

---

## Development Workflow

### First Startup

```bash
# 1. Check .env file
cat .env

# 2. Start Docker services
docker compose up -d

# 3. Follow logs (optional)
docker compose logs -f

# 4. Verify all services are running
docker compose ps

# 5. Test in browser
# - Admin: http://localhost:3000
# - Storefront: http://localhost:3001
# - API: http://localhost:4000
# - Adminer: http://localhost:8080
```

### Daily Development

1. **Start services:**
   ```bash
   docker compose up -d
   ```

2. **Modify code:**
   - Changes automatically sync (volume mount)
   - Hot reload enabled (Next.js and NestJS)

3. **Watch logs:**
   ```bash
   docker compose logs -f admin api
   ```

4. **Restart service (if needed):**
   ```bash
   docker compose restart admin
   ```

### Database Operations

```bash
# Run Prisma migration (in API container)
docker exec api npx prisma migrate dev

# Open Prisma Studio (GUI)
docker exec api npx prisma studio

# Load seed data
docker exec api npm run seed

# PostgreSQL CLI
docker exec -it postgres psql -U priceflow_user -d priceflow
```

### Adding New Domains (DDD)

To add a new domain (e.g., User domain):

1. **Create domain structure:**
   ```bash
   mkdir -p apps/api/src/domains/user/{models,dto,repositories,services,controllers}
   ```

2. **Implement following the Shop domain pattern:**
   - `models/user.model.ts` - Domain model with business logic
   - `dto/create-user.dto.ts` - Request DTOs with validation
   - `repositories/user.repository.interface.ts` - Repository port
   - `repositories/user.repository.ts` - Prisma adapter
   - `services/user.service.ts` - Domain service
   - `controllers/user.controller.ts` - HTTP controller
   - `user.module.ts` - NestJS module

3. **Register in AppModule:**
   ```typescript
   imports: [
     PrismaModule,
     ShopModule,
     UserModule, // New domain
   ]
   ```

### Troubleshooting

**If a service doesn't start:**
```bash
docker compose logs <service_name>
docker compose restart <service_name>
```

**If port conflict:**
```bash
# Check what's using the port
lsof -i :3000
sudo netstat -tuln | grep 3000
```

**Full reset (with data loss!):**
```bash
docker compose down -v
docker compose up -d --build
```

---

## Changelog

### 2025-12-21 (16:00) - DDD + Hexagonal Architecture Refactoring
**Major refactoring: Migrated to Domain-Driven Design + Hexagonal Architecture**

**Changes:**
1. **Architecture Overhaul**
   - Migrated from traditional NestJS structure to DDD + Hexagonal Architecture
   - Domain-centered organization (feature-by-folder)
   - Repository Pattern implementation (Port + Adapter)
   - Separated domain models from Prisma entities

2. **Common Domain Infrastructure**
   - Created `domains/common/database/` for shared infrastructure
   - `PrismaService` now global and reusable across all domains
   - `PrismaModule` as Global Module

3. **Shop Domain Implementation**
   - `models/shop.model.ts` - Domain model with business logic
     - Factory methods for creating and loading shops
     - Domain behaviors: activate(), deactivate(), updateAccessToken()
     - Built-in validation
   - `dto/` - Request/Response DTOs with class-validator
     - CreateShopSessionDto with validation decorators
     - ShopResponseDto with factory methods
   - `repositories/` - Repository Pattern (Hexagonal)
     - IShopRepository interface (Port - technology-independent)
     - ShopRepository implementation (Adapter - Prisma-specific)
   - `services/shop.service.ts` - Application service using repository
   - `controllers/shop.controller.ts` - HTTP layer with DTO validation
   - `shop.module.ts` - Domain module with proper DI setup

4. **Validation & Dependencies**
   - Installed `class-validator` and `class-transformer`
   - Global ValidationPipe in `main.ts`
   - Automatic DTO validation on all requests
   - Type-safe request/response handling

5. **New Features**
   - New endpoint: `DELETE /shopify/session/:shop` - Deactivate shop
   - Validation errors return 400 Bad Request with detailed messages
   - Domain models with encapsulation and business logic

6. **File Structure Changes**
   - Removed: `src/shopify/` (old structure)
   - Added: `src/domains/common/` and `src/domains/shop/`
   - All domain logic self-contained in domain folders

**Benefits:**
- ✅ Separation of Concerns (Model, Repository, Service, Controller)
- ✅ Technology Independence (easy to swap Prisma for TypeORM)
- ✅ Testability (repository mocking, isolated domain logic)
- ✅ Scalability (easy to add new domains)
- ✅ Type Safety & Validation (DTOs with decorators)
- ✅ Reusability (PrismaService available everywhere)

**Migration Path for Other Domains:**
Follow the Shop domain pattern:
1. Create domain folder structure
2. Implement domain model
3. Create DTOs with validation
4. Implement repository interface + Prisma adapter
5. Create service using repository
6. Create controller using DTOs
7. Set up module with DI
8. Register in AppModule

### 2025-12-21 (14:00) - Prisma 7 and LocalStack Fixes
**Problem:** API container failed to start due to Prisma and LocalStack errors

**Fixes:**
1. **LocalStack Initialization Fix** (`infra/localstack/init-secrets.sh`)
   - Script was waiting for `"secretsmanager": "available"` status
   - LocalStack returns `"secretsmanager": "running"` status
   - Modified regex to accept both: `grep -qE '"secretsmanager": "(available|running)"'`

2. **Prisma 7 Adapter Integration** (`apps/api/src/shopify/shopify.service.ts`)
   - Prisma 7 new TypeScript-based query compiler architecture requires adapter or Accelerate
   - Installed packages: `@prisma/adapter-pg`, `pg`
   - Using PostgreSQL Pool and PrismaPg adapter in PrismaClient constructor
   - Updated `schema.prisma`: added `engineType = "binary"`

3. **API Endpoints Available:**
   - `GET /` - Healthcheck
   - `GET /secrets` - Secrets testing
   - `GET /db-config` - DB configuration
   - `POST /shopify/session` - Session storage
   - `GET /shopify/session/:shop` - Session retrieval

**Migrations:** 2 migrations successfully applied:
- `20251219101945_init` - User and Post models
- `20251219140224_add_shop_model` - Shop model

### 2025-12-21 - Project Initialization
- Docker Compose configuration setup
- 3 main application components setup (admin, storefront, api)
- PostgreSQL database + Adminer UI
- LocalStack (AWS Secrets Manager mock)
- Nginx reverse proxy
- Cloudflare Tunnel configuration
- Next.js 16 + React 19 admin and storefront
- NestJS 11 + Prisma 7 backend API

---

## Notes

### Hot Reload

All development services (admin, storefront, api) support hot reload:
- Source code mounted from `./apps/*` folders into containers
- `node_modules`, `.next`, `.pnpm-store` handled as anonymous volumes
- `WATCHPACK_POLLING=true` ensures file watching works in Docker

### Network

All services run in a common `shopify-network` bridge network:
- Services can access each other via DNS names (e.g., `http://api:4000`)
- Host machine accesses services via ports

### Volumes

Persistent data storage:
- `postgres-data` - PostgreSQL data
- `localstack-data` - LocalStack data

### Health Checks

Services with health checks:
- PostgreSQL: `pg_isready`
- LocalStack: HTTP health endpoint
- Nginx: `/health` endpoint

### Known Issues and Solutions

#### 1. API won't start: "PrismaClientConstructorValidationError"

**Symptom:**
```
Using engine type "client" requires either "adapter" or "accelerateUrl"
to be provided to PrismaClient constructor.
```

**Cause:** Prisma 7 new TypeScript-based query compiler architecture requires adapter.

**Solution:**
- Install `@prisma/adapter-pg` and `pg` packages
- Use PrismaPg adapter in PrismaClient constructor
- See: `apps/api/src/domains/common/database/prisma.service.ts`

#### 2. LocalStack init infinite loop "Waiting for Secrets Manager..."

**Symptom:**
```
localstack-init  | Waiting for Secrets Manager...
localstack-init  | Waiting for Secrets Manager...
...
```

**Cause:** Health check expects `"secretsmanager": "available"` but LocalStack returns `"running"`.

**Solution:**
- Modify `infra/localstack/init-secrets.sh` script
- Regex: `grep -qE '"secretsmanager": "(available|running)"'`

#### 3. Prisma migrations don't run

**Check:**
```bash
docker compose logs api | grep -i migration
```

**Solution:**
```bash
docker exec api npx prisma migrate deploy
```

#### 4. CLOUDFLARE_TUNNEL_TOKEN empty error

**Symptom:**
```
Invalid length for parameter SecretString, value: 0, valid min length: 1
```

**Cause:** `CLOUDFLARE_TUNNEL_TOKEN` is empty in `.env` file.

**Solution:** Not a critical error, just a warning. Ignore if not using Cloudflare Tunnel.

---

## Documentation Rules

### This is the ONLY Documentation!

**In this project we EXCLUSIVELY use this `PROJECT_STATUS.md` file for documentation.**

- ❌ **NO** separate README.md for features
- ❌ **NO** separate ARCHITECTURE.md
- ❌ **NO** separate API.md
- ❌ **NO** separate SETUP.md
- ✅ **ALL** information is recorded here

### Update Rules:

1. **Update this file after any change!**
2. Add entry to Changelog section
3. Update "Last Updated" date at top of file
4. If adding new service, update Docker Services and Ports sections
5. If adding/removing environment variables, update Environment Variables section

---

**Important:** This documentation is a living document. Record all changes in the Changelog section!
