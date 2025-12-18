# Base stage - setup pnpm
FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /usr/src/app

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Dependencies stage - install all dependencies
FROM base AS deps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development

# Copy node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Set environment to development
ENV NODE_ENV=development

# Start development server
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
    adduser --system --uid 1001 nestjs

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
