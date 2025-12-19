import {
  SecretsManagerClient,
  GetSecretValueCommand,
  ListSecretsCommand,
} from "@aws-sdk/client-secrets-manager";

const createSecretsClient = () => {
  const isDevelopment = process.env.NODE_ENV === "development";

  return new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: isDevelopment ? "http://localstack:4566" : undefined,
    credentials: isDevelopment
      ? {
          accessKeyId: "test",
          secretAccessKey: "test",
        }
      : undefined,
  });
};

const client = createSecretsClient();

export async function getSecret(secretName: string): Promise<string | null> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    return response.SecretString || null;
  } catch (error) {
    console.error(`Failed to get secret: ${secretName}`, error);
    return null;
  }
}

export async function getSecrets(
  secretNames: string[]
): Promise<Record<string, string>> {
  const secrets: Record<string, string> = {};

  await Promise.all(
    secretNames.map(async (name) => {
      const value = await getSecret(name);
      if (value) {
        secrets[name] = value;
      }
    })
  );

  return secrets;
}

export async function listAllSecrets(): Promise<string[]> {
  try {
    const command = new ListSecretsCommand({});
    const response = await client.send(command);

    return response.SecretList?.map((secret) => secret.Name || "").filter(
      Boolean
    ) || [];
  } catch (error) {
    console.error("Failed to list secrets", error);
    return [];
  }
}

export async function secretExists(secretName: string): Promise<boolean> {
  const value = await getSecret(secretName);
  return value !== null;
}
