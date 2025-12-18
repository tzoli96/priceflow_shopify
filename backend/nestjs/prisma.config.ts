import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://priceflow_user:priceflow_secure_password_change_me@postgres:5432/priceflow?schema=public",
  },
});
