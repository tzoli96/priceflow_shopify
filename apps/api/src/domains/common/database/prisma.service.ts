import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const useSSL = connectionString.includes('sslmode=require');
    // Strip sslmode from connection string to avoid conflict with explicit ssl option
    const cleanConnectionString = useSSL
      ? connectionString.replace(/[?&]sslmode=require/, (m) => m.startsWith('?') ? '?' : '').replace(/\?$/, '')
      : connectionString;
    const pool = new Pool({
      connectionString: cleanConnectionString,
      ...(useSSL && { ssl: { rejectUnauthorized: false } }),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }
}
