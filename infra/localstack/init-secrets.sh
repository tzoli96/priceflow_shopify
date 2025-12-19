#!/bin/bash

set -e

echo "Waiting for LocalStack Secrets Manager to be ready..."

# Wait for LocalStack to be fully ready
until curl -s http://localstack:4566/_localstack/health | grep -q '"secretsmanager": "available"' 2>/dev/null; do
  echo "Waiting for Secrets Manager..."
  sleep 2
done

echo "LocalStack is ready. Importing secrets from .env file..."

ENV_FILE="${ENV_FILE:-/app/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Read .env file and create individual secrets
while IFS= read -r line || [ -n "$line" ]; do
  # Skip comments and empty lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$line" ]] && continue

  # Extract key and value
  if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"

    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Remove quotes from value if present
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"

    if [ -n "$key" ]; then
      echo "Creating secret: $key"

      # Try to create or update the secret
      aws --endpoint-url=http://localstack:4566 \
          --region us-east-1 \
          --no-verify-ssl \
          secretsmanager create-secret \
          --name "$key" \
          --secret-string "$value" 2>/dev/null || \
      aws --endpoint-url=http://localstack:4566 \
          --region us-east-1 \
          --no-verify-ssl \
          secretsmanager put-secret-value \
          --secret-id "$key" \
          --secret-string "$value"

      echo "✓ Secret created/updated: $key"
    fi
  fi
done < "$ENV_FILE"

echo ""
echo "=== Secrets imported successfully ==="
echo ""

# List all secrets
echo "Available secrets:"
aws --endpoint-url=http://localstack:4566 \
    --region us-east-1 \
    --no-verify-ssl \
    secretsmanager list-secrets \
    --query 'SecretList[].Name' \
    --output table

echo ""
echo "Initialization complete!"
