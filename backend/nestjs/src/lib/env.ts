import { getSecret, getSecrets, listAllSecrets } from "./secrets";

let envCache: Record<string, string> | null = null;
let isLoading = false;

export async function loadEnv(): Promise<Record<string, string>> {
  if (envCache) {
    return envCache;
  }

  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return envCache || {};
  }

  isLoading = true;

  try {
    console.log("[ENV] Loading environment variables from Secrets Manager...");

    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      envCache = process.env as Record<string, string>;
      return envCache;
    }

    const secretNames = await listAllSecrets();
    console.log(`[ENV] Found ${secretNames.length} secrets`);

    const secrets = await getSecrets(secretNames);

    envCache = secrets;

    console.log(
      `[ENV] Successfully loaded ${Object.keys(secrets).length} environment variables`
    );

    return envCache;
  } catch (error) {
    console.error("[ENV] Failed to load environment variables:", error);
    return {};
  } finally {
    isLoading = false;
  }
}

export async function getEnv(key: string): Promise<string | undefined> {
  if (!envCache) {
    await loadEnv();
  }

  return envCache?.[key];
}

export async function getRequiredEnv(key: string): Promise<string> {
  const value = await getEnv(key);

  if (!value) {
    throw new Error(`Required environment variable is missing: ${key}`);
  }

  return value;
}

export function clearEnvCache(): void {
  envCache = null;
}

export function setEnv(key: string, value: string): void {
  if (!envCache) {
    envCache = {};
  }
  envCache[key] = value;
}
