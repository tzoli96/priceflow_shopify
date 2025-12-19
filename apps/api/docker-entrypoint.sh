#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo "🔄 Running Prisma migrations..."
pnpm prisma migrate deploy || {
  echo "⚠️  Migration failed, trying migrate dev..."
  pnpm prisma migrate dev --name auto_migration || true
}

echo "🚀 Starting NestJS application..."
exec "$@"
