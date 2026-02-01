# =============================================================================
# variables.tf - Bemeneti változók (Input Variables)
# =============================================================================
#
# A változók teszik a Terraform kódot újrafelhasználhatóvá.
# Ahelyett, hogy mindent "beleégetnénk" a kódba, változókat használunk,
# amiket a terraform.tfvars fájlban adunk meg.
#
# Típusok:
#   string  - szöveg (pl. "eu-central-1")
#   number  - szám (pl. 256)
#   bool    - igaz/hamis
#   list    - lista (pl. ["a", "b"])
#   map     - kulcs-érték párok
#
# A `sensitive = true` megakadályozza, hogy a Terraform kiírja az értéket
# a konzolra (pl. jelszavak, API kulcsok esetén).
# =============================================================================

# -----------------------------------------------------------------------------
# Alap projekt beállítások
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "A projekt neve - ez lesz az erőforrások nevében (pl. priceflow-api, priceflow-rds)"
  type        = string
  default     = "priceflow"
}

variable "aws_region" {
  description = "AWS régió - eu-central-1 = Frankfurt, a legközelebbi EU régió Magyarországhoz"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Környezet neve (production, staging, development) - tag-ekben jelenik meg"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Az alkalmazás domain neve (opcionális, később HTTPS-hez kell)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Adatbázis beállítások
# -----------------------------------------------------------------------------

variable "db_username" {
  description = "PostgreSQL admin felhasználónév"
  type        = string
  default     = "priceflow_admin"
}

variable "db_password" {
  description = "PostgreSQL admin jelszó - MINDIG a terraform.tfvars-ban add meg, SOHA ne commitold!"
  type        = string
  sensitive   = true # A Terraform nem fogja kiírni ezt az értéket a konzolra
}

variable "db_name" {
  description = "Az adatbázis neve"
  type        = string
  default     = "priceflow"
}

variable "db_instance_class" {
  description = "RDS instance típus - db.t3.micro a legolcsóbb (Free Tier-ben ingyenes)"
  type        = string
  default     = "db.t3.micro"
}

# -----------------------------------------------------------------------------
# Shopify beállítások (érzékeny adatok)
# -----------------------------------------------------------------------------

variable "shopify_api_key" {
  description = "Shopify alkalmazás API kulcs"
  type        = string
  sensitive   = true
}

variable "shopify_api_secret" {
  description = "Shopify alkalmazás titkos kulcs"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Alkalmazás titkos kulcsok
# -----------------------------------------------------------------------------

variable "jwt_secret" {
  description = "JWT token aláíráshoz használt titkos kulcs"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Általános titkosítási kulcs az alkalmazáshoz"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Konténer méret beállítások
# -----------------------------------------------------------------------------
# Az ECS Fargate-ben a CPU és memória együtt határozza meg a konténer méretét.
# Érvényes kombinációk (CPU → lehetséges memória):
#   256  (.25 vCPU) → 512 MB, 1 GB, 2 GB
#   512  (.5 vCPU)  → 1 GB - 4 GB
#   1024 (1 vCPU)   → 2 GB - 8 GB
#   2048 (2 vCPU)   → 4 GB - 16 GB
#   4096 (4 vCPU)   → 8 GB - 30 GB
# -----------------------------------------------------------------------------

variable "api_cpu" {
  description = "API konténer CPU egysége (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "API konténer memória (MB-ban)"
  type        = number
  default     = 512
}

variable "admin_cpu" {
  description = "Admin konténer CPU egysége"
  type        = number
  default     = 256
}

variable "admin_memory" {
  description = "Admin konténer memória (MB-ban)"
  type        = number
  default     = 512
}

variable "storefront_cpu" {
  description = "Storefront konténer CPU egysége"
  type        = number
  default     = 256
}

variable "storefront_memory" {
  description = "Storefront konténer memória (MB-ban)"
  type        = number
  default     = 512
}

# -----------------------------------------------------------------------------
# Skálázás beállítások
# -----------------------------------------------------------------------------

variable "api_desired_count" {
  description = "Hány API konténer fusson egyszerre (minimum 1)"
  type        = number
  default     = 1
}

variable "admin_desired_count" {
  description = "Hány Admin konténer fusson egyszerre"
  type        = number
  default     = 1
}

variable "storefront_desired_count" {
  description = "Hány Storefront konténer fusson egyszerre"
  type        = number
  default     = 1
}
