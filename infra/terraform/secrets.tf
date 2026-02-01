# =============================================================================
# secrets.tf - AWS Secrets Manager (titkos kulcsok tárolása)
# =============================================================================
#
# A Secrets Manager biztonságosan tárolja az érzékeny adatokat:
# - Adatbázis jelszavak
# - API kulcsok
# - JWT titkos kulcsok
#
# Miért nem környezeti változóként adjuk meg közvetlenül?
#   - A Secrets Manager titkosítva tárolja (AES-256)
#   - Audit log: látható, ki és mikor kérte le a titkot
#   - Automatikus rotáció lehetőség (pl. DB jelszó cserélése)
#   - Az ECS automatikusan lekéri és beinjektálja a konténerbe
#
# FONTOS: Minden secret 2 részből áll:
#   1. aws_secretsmanager_secret     = A "doboz" (azonosító, neve)
#   2. aws_secretsmanager_secret_version = A "tartalom" (maga a titkos érték)
# =============================================================================

# =============================================================================
# DATABASE_URL - Az adatbázis kapcsolati sztring
# =============================================================================
# Ezt automatikusan generáljuk az RDS endpoint-ból, nem kell kézzel megadni.
# Formátum: postgresql://user:password@host:port/database
# =============================================================================

resource "aws_secretsmanager_secret" "database_url" {
  name        = "${var.project_name}/${var.environment}/database-url"
  description = "PostgreSQL kapcsolati sztring az API-hoz"

  # Ha törölni akarod a Terraform-mal, ne kelljen várni (alapból 30 nap)
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-database-url"
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id

  # A DATABASE_URL-t az RDS adataiból építjük fel automatikusan
  secret_string = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"
}

# =============================================================================
# SHOPIFY_API_KEY
# =============================================================================
resource "aws_secretsmanager_secret" "shopify_api_key" {
  name                    = "${var.project_name}/${var.environment}/shopify-api-key"
  description             = "Shopify alkalmazas API kulcs"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-shopify-api-key"
  }
}

resource "aws_secretsmanager_secret_version" "shopify_api_key" {
  secret_id     = aws_secretsmanager_secret.shopify_api_key.id
  secret_string = var.shopify_api_key
}

# =============================================================================
# SHOPIFY_API_SECRET
# =============================================================================
resource "aws_secretsmanager_secret" "shopify_api_secret" {
  name                    = "${var.project_name}/${var.environment}/shopify-api-secret"
  description             = "Shopify alkalmazas titkos kulcs"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-shopify-api-secret"
  }
}

resource "aws_secretsmanager_secret_version" "shopify_api_secret" {
  secret_id     = aws_secretsmanager_secret.shopify_api_secret.id
  secret_string = var.shopify_api_secret
}

# =============================================================================
# JWT_SECRET
# =============================================================================
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}/${var.environment}/jwt-secret"
  description             = "JWT token alairashoz hasznalt titkos kulcs"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# =============================================================================
# ENCRYPTION_KEY
# =============================================================================
resource "aws_secretsmanager_secret" "encryption_key" {
  name                    = "${var.project_name}/${var.environment}/encryption-key"
  description             = "Altalanos titkositasi kulcs"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-encryption-key"
  }
}

resource "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id     = aws_secretsmanager_secret.encryption_key.id
  secret_string = var.encryption_key
}
