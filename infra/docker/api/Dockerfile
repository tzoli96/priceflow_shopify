# Base stage - setup pnpm
FROM node:22-alpine AS base

# Install pnpm globally and netcat for healthcheck
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache netcat-openbsd

# Set working directory
WORKDIR /usr/src/app

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Copy Prisma schema (needed for postinstall script)
COPY prisma ./prisma

# Dependencies stage - install all dependencies
FROM base AS deps

# Install dependencies (postinstall will run prisma generate)
RUN pnpm install

# Development stage
FROM base AS development

# Copy node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Copy and setup entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 4000

# Set environment to development
ENV NODE_ENV=development

# Use entrypoint for migrations and startup
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "start:dev"]

# Builder stage - build application
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

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

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=4000

# Start production server
CMD ["node", "dist/main"]
