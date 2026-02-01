# =============================================================================
# ecr.tf - Elastic Container Registry (Docker Image tároló)
# =============================================================================
#
# Az ECR az AWS saját Docker registry szolgáltatása.
# Ide töltjük fel a Docker image-eket, és innen húzza le az ECS Fargate.
#
# Minden alkalmazásnak saját ECR repository-ja van:
#   - priceflow-api        → NestJS API szerver
#   - priceflow-admin      → Next.js admin felület
#   - priceflow-storefront → Next.js storefront
#
# A Docker image-ek feltöltésének menete:
#   1. aws ecr get-login-password | docker login ...
#   2. docker build -t priceflow-api .
#   3. docker tag priceflow-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/priceflow-api:latest
#   4. docker push <account-id>.dkr.ecr.<region>.amazonaws.com/priceflow-api:latest
# =============================================================================

# -----------------------------------------------------------------------------
# ECR Repository - API
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "api" {
  name = "${var.project_name}-api"

  # A "MUTABLE" azt jelenti, hogy ugyanazt a tag-et (pl. "latest") felülírhatjuk
  # új image-gel. Gyorsabb fejlesztésnél ez kényelmes.
  # Ha szigorúbb verziózást szeretnél, állítsd "IMMUTABLE"-re.
  image_tag_mutability = "MUTABLE"

  # Az image-ek automatikus titkosítása (AES-256)
  encryption_configuration {
    encryption_type = "AES256"
  }

  # Sebezhetőség-vizsgálat: minden push-nál automatikusan átvizsgálja az image-et
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# -----------------------------------------------------------------------------
# ECR Repository - Admin
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "admin" {
  name                 = "${var.project_name}-admin"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-admin"
  }
}

# -----------------------------------------------------------------------------
# ECR Repository - Storefront
# -----------------------------------------------------------------------------
resource "aws_ecr_repository" "storefront" {
  name                 = "${var.project_name}-storefront"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-storefront"
  }
}

# -----------------------------------------------------------------------------
# Lifecycle Policy - Régi image-ek automatikus törlése
# -----------------------------------------------------------------------------
# Hogy ne gyűljenek fel a régi Docker image-ek (és ne fizessünk értük),
# beállítunk egy szabályt: maximum 10 image-et tartunk meg repository-nként.
# A legrégebbieket automatikusan törli az AWS.
# -----------------------------------------------------------------------------

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Maximum 10 image megtartasa"
        selection = {
          tagStatus   = "any"      # Minden image-re vonatkozik (tagged + untagged)
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire" # Törlés
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "admin" {
  repository = aws_ecr_repository.admin.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Maximum 10 image megtartasa"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "storefront" {
  repository = aws_ecr_repository.storefront.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Maximum 10 image megtartasa"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
