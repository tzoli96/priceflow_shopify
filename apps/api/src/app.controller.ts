import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { loadEnv, getEnv } from "./lib/env";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("secrets")
  async getSecrets() {
    try {
      const env = await loadEnv();

      return {
        success: true,
        count: Object.keys(env).length,
        keys: Object.keys(env),
        env,
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "Failed to load secrets",
      };
    }
  }

  @Get("db-config")
  async getDatabaseConfig() {
    try {
      const dbHost = await getEnv("POSTGRES_HOST");
      const dbPort = await getEnv("POSTGRES_PORT");
      const dbName = await getEnv("POSTGRES_DB");
      const dbUser = await getEnv("POSTGRES_USER");
      const dbPassword = await getEnv("POSTGRES_PASSWORD");

      return {
        success: true,
        config: {
          host: dbHost || "not found",
          port: dbPort || "not found",
          database: dbName || "not found",
          user: dbUser || "not found",
          password: dbPassword ? "***" : "not found",
        },
        connectionString: dbHost && dbPort && dbName && dbUser && dbPassword
          ? `postgresql://${dbUser}:***@${dbHost}:${dbPort}/${dbName}`
          : "incomplete configuration",
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "Failed to get database config",
      };
    }
  }
}
