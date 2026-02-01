# =============================================================================
# main.tf - Terraform Provider és Backend konfiguráció
# =============================================================================
#
# Ez a fájl határozza meg:
# 1. Milyen cloud provider-t használunk (AWS)
# 2. Melyik régióban hozzuk létre az erőforrásokat
# 3. Hol tároljuk a Terraform "állapotát" (state)
#
# A Terraform state egy JSON fájl, ami nyilvántartja, milyen erőforrások
# léteznek már az AWS-ben. Ezért tudja a Terraform, hogy mit kell létrehozni,
# módosítani vagy törölni a következő `terraform apply` futtatáskor.
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform beállítások
# -----------------------------------------------------------------------------
# A `required_providers` megmondja, melyik provider plugint kell letölteni.
# A `required_version` biztosítja, hogy mindenki ugyanazt a Terraform verziót
# használja, elkerülve a kompatibilitási problémákat.
# -----------------------------------------------------------------------------
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # 5.x verzió, de nem 6.x - a ~ megengedi a minor frissítéseket
    }
  }

  # -------------------------------------------------------------------------
  # Backend konfiguráció - Hol tároljuk a Terraform state-et?
  # -------------------------------------------------------------------------
  # Kezdetben "local" backend-et használunk (a state a gépeden marad).
  # Később, ha csapatban dolgozol, érdemes S3 backend-re váltani,
  # hogy mindenki ugyanazt a state-et lássa.
  #
  # Ha S3 backend-et szeretnél, hozz létre egy S3 bucket-et kézzel,
  # majd vedd ki a kommentet az alábbi blokkból:
  #
  # backend "s3" {
  #   bucket         = "priceflow-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "eu-central-1"
  #   encrypt        = true                          # State titkosítása
  #   dynamodb_table = "priceflow-terraform-locks"   # Zárolás, hogy ne írja felül egymást két ember
  # }
  # -------------------------------------------------------------------------
}

# -----------------------------------------------------------------------------
# AWS Provider konfiguráció
# -----------------------------------------------------------------------------
# A provider mondja meg a Terraform-nak, hogy az AWS API-ját használja,
# és melyik régióban dolgozzon.
#
# A hitelesítés (authentication) az AWS CLI-ből jön:
# - Vagy az `aws configure` paranccsal beállított credential-ek
# - Vagy az AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY környezeti változók
# - Vagy IAM role (ha EC2 instance-on futtatod)
# -----------------------------------------------------------------------------
# -----------------------------------------------------------------------------
# Az aktuális AWS fiók adatai
# -----------------------------------------------------------------------------
# Ez egy "data source" - nem hoz létre semmit, csak lekérdezi a fiók adatait.
# Az account_id-t az S3 bucket nevéhez és más erőforrásokhoz használjuk,
# hogy globálisan egyedi nevet kapjanak.
# -----------------------------------------------------------------------------
data "aws_caller_identity" "current" {}

provider "aws" {
  region = var.aws_region

  # Minden erőforrásra automatikusan rákerülnek ezek a tag-ek.
  # A tag-ek segítenek azonosítani, hogy melyik projekt erőforrásai,
  # és megkönnyítik a költségek nyomon követését is.
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform" # Ezzel jelezzük, hogy Terraform kezeli, ne módosítsuk kézzel!
    }
  }
}
