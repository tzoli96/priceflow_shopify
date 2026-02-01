# Base stage - setup pnpm
FROM node:22-alpine AS base

# Install pnpm globally and netcat for healthcheck
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache netcat-openbsd

# Set working directory
WORKDIR /usr/src/app

# Copy package files and pnpm config
COPY apps/api/package.json apps/api/pnpm-lock.yaml ./

# Copy Prisma schema (needed for postinstall script)
COPY apps/api/prisma ./prisma

# Copy Prisma config
COPY apps/api/prisma.config.ts ./prisma.config.ts

# Dependencies stage - install all dependencies
FROM base AS deps

# Install dependencies (postinstall will run prisma generate)
RUN pnpm install

# Builder stage - build application
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application code
COPY apps/api/ .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create app user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

WORKDIR /usr/src/app

# Copy package files
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy Prisma schema and config (needed for postinstall prisma generate and migrate deploy)
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder --chown=api:nodejs /usr/src/app/dist ./dist

# Switch to non-root user
USER api

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Run migrations and start production server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main"]
