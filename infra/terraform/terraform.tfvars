# =============================================================================
# terraform.tfvars.example - Példa konfigurációs fájl
# =============================================================================
#
# HASZNÁLAT:
#   1. Másold le ezt a fájlt: cp terraform.tfvars.example terraform.tfvars
#   2. Töltsd ki a valódi értékekkel
#   3. SOHA ne commitold a terraform.tfvars fájlt! (benne van a .gitignore-ban)
#
# A terraform.tfvars fájlban megadott értékek felülírják a variables.tf
# default értékeit. A Terraform automatikusan beolvassa ezt a fájlt.
# =============================================================================

# Alap beállítások
project_name = "priceflow"
aws_region   = "eu-central-1"
environment  = "production"
domain_name  = ""  # Opcionális: pl. "app.example.com"

# Adatbázis
db_username       = "priceflow_admin"
db_password       = "admin9999"  # Legalább 8 karakter, erős jelszó!
db_name           = "priceflow"
db_instance_class = "db.t3.micro"         # Free Tier

# Shopify
shopify_api_key         = "a2087c36b3d88c748e9e2339ebab5527"
shopify_api_secret      = "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"
shopify_organization_id = "4577134"
shop_url                = "priceflow-dev.myshopify.com"

# Alkalmazás titkos kulcsok
jwt_secret     = "43ad074df37e18f8348154906f3caf278eb13c229c1840491770df91dc0b4159"
encryption_key = "af44ea71436de970c1f2e916b2aa0da1b50ea3007b738ac26953684774d1c865"

# Konténer méretek (alapértelmezések jók kis forgalomhoz)
# api_cpu    = 256
# api_memory = 512
# admin_cpu    = 256
# admin_memory = 512
# storefront_cpu    = 256
# storefront_memory = 512

# Skálázás
# api_desired_count        = 1
# admin_desired_count      = 1
# storefront_desired_count = 1
