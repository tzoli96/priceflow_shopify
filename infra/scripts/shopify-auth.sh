#!/bin/bash

# Shopify CLI Auto-Authentication Script
# This script automatically authenticates Shopify CLI using credentials from LocalStack Secrets Manager
# Usage: ./scripts/shopify-auth.sh

set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔐 Shopify CLI Auto-Authentication"
echo "===================================="
echo ""

# Check if LocalStack is running
if ! curl -s "${LOCALSTACK_ENDPOINT}/_localstack/health" > /dev/null 2>&1; then
  echo "❌ Error: LocalStack is not running at ${LOCALSTACK_ENDPOINT}"
  echo "   Start it with: docker-compose up -d localstack"
  exit 1
fi

echo "✓ LocalStack is running"

# Function to get secret from LocalStack
get_secret() {
  local secret_name=$1
  aws --endpoint-url="${LOCALSTACK_ENDPOINT}" \
      --region "${AWS_REGION}" \
      --no-verify-ssl \
      secretsmanager get-secret-value \
      --secret-id "$secret_name" \
      --query SecretString \
      --output text 2>/dev/null || echo ""
}

# Retrieve credentials from LocalStack
echo "📥 Fetching credentials from Secrets Manager..."
SHOPIFY_API_KEY=$(get_secret "SHOPIFY_API_KEY")
SHOPIFY_API_SECRET=$(get_secret "SHOPIFY_API_SECRET")
SHOP_URL=$(get_secret "SHOP_URL")

if [ -z "$SHOPIFY_API_KEY" ] || [ -z "$SHOPIFY_API_SECRET" ]; then
  echo "❌ Error: Shopify credentials not found in Secrets Manager"
  echo "   Run 'docker-compose up localstack-init' to import secrets from .env"
  exit 1
fi

echo "✓ Credentials retrieved"

# Create Shopify CLI config directory
SHOPIFY_CLI_DIR="${HOME}/.config/shopify"
mkdir -p "${SHOPIFY_CLI_DIR}"

# Create shopify-cli.yml with credentials
cat > "${SHOPIFY_CLI_DIR}/shopify-cli.yml" <<EOF
# Auto-generated Shopify CLI configuration
# Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

[stores]
  [stores.default]
  domain = "${SHOP_URL}"

[auth]
  [auth.default]
  client_id = "${SHOPIFY_API_KEY}"
  client_secret = "${SHOPIFY_API_SECRET}"
EOF

chmod 600 "${SHOPIFY_CLI_DIR}/shopify-cli.yml"

echo "✓ Shopify CLI config created at ${SHOPIFY_CLI_DIR}/shopify-cli.yml"
echo ""
echo "🎉 Authentication complete!"
echo ""
echo "Next steps:"
echo "  1. cd to your app directory (apps/embedded-app or apps/widget-app)"
echo "  2. Run: shopify app dev"
echo ""
echo "Your credentials are now synced from LocalStack Secrets Manager."
echo "This works on any machine with access to LocalStack!"
