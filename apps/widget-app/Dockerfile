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
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Start development server
CMD ["pnpm", "dev"]

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
    adduser --system --uid 1001 nextjs

WORKDIR /usr/src/app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start production server
CMD ["pnpm", "start"]
