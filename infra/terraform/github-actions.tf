# =============================================================================
# github-actions.tf - GitHub Actions OIDC alapú CI/CD jogosultságok
# =============================================================================
#
# Ez a fájl beállítja az OIDC (OpenID Connect) alapú autentikációt a GitHub
# Actions és az AWS között. Ezzel nem kell long-lived AWS access key-eket
# tárolni GitHub Secrets-ben - ehelyett a GitHub Actions futáskor kap egy
# rövid életű tokent, amit az AWS elfogad.
#
# Hogyan működik:
#   1. A GitHub Actions workflow OIDC tokent kér a GitHub-tól
#   2. Az AWS megkapja a tokent és ellenőrzi az OIDC provider-en keresztül
#   3. Ha a token érvényes ÉS a mi repo-nkból jön → AssumeRole sikeres
#   4. A workflow rövid életű AWS credential-okat kap (max 1 óra)
#
# Biztonság:
#   - Nincs long-lived credential → nem lehet ellopni
#   - Csak a megadott repo-ból jövő tokeneket fogadjuk el
#   - A jogosultságok minimálisak (ECR push, ECS redeploy)
# =============================================================================

# -----------------------------------------------------------------------------
# GitHub OIDC Provider
# -----------------------------------------------------------------------------
# Az AWS-nek tudnia kell, hogy a GitHub Actions tokenek megbízhatóak.
# Ez az OIDC provider mondja meg az AWS-nek:
#   "Bízz meg a token.actions.githubusercontent.com által kiállított tokenekben"
#
# FIGYELEM: AWS account-onként CSAK EGY GitHub OIDC provider lehet!
# Ha már van egy másik Terraform konfigurációban, akkor ez ütközni fog.
# -----------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  # A "client_id" (audience) mindig "sts.amazonaws.com" a GitHub Actions-nél
  client_id_list = ["sts.amazonaws.com"]

  # A GitHub OIDC provider TLS tanúsítvány thumbprint-je
  # Az AWS ezt használja a GitHub identity provider hitelességének ellenőrzésére
  # Ez a GitHub Actions OIDC közismert thumbprint-je
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name = "${var.project_name}-github-oidc"
  }
}

# -----------------------------------------------------------------------------
# GitHub Actions IAM Role
# -----------------------------------------------------------------------------
# Ez a role-t veszi fel a GitHub Actions workflow.
# A trust policy biztosítja, hogy CSAK a mi repo-nk main branch-éről
# jövő tokeneket fogadjuk el.
# -----------------------------------------------------------------------------
resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            # Csak az "sts.amazonaws.com" audience-t fogadjuk el
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Csak a megadott repo-ból jövő tokeneket fogadjuk el
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-github-actions"
  }
}

# -----------------------------------------------------------------------------
# ECR Push jogosultság
# -----------------------------------------------------------------------------
# A GitHub Actions-nek kell:
# - Bejelentkezni az ECR-be (GetAuthorizationToken)
# - Docker image-eket pusholni (BatchCheckLayerAvailability, PutImage, stb.)
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "${var.project_name}-github-actions-ecr"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken", # ECR bejelentkezéshez (docker login)
        ]
        Resource = "*" # GetAuthorizationToken nem támogat resource szűrést
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", # Ellenőrzi, mely layer-ek vannak már fent
          "ecr:PutImage",                    # Az image manifest feltöltése
          "ecr:InitiateLayerUpload",         # Layer feltöltés indítása
          "ecr:UploadLayerPart",             # Layer darab feltöltése
          "ecr:CompleteLayerUpload",         # Layer feltöltés befejezése
          "ecr:BatchGetImage",               # Image lekérése (cache-hez)
          "ecr:GetDownloadUrlForLayer",      # Layer letöltési URL (cache-hez)
        ]
        Resource = [
          aws_ecr_repository.api.arn,
          aws_ecr_repository.admin.arn,
          aws_ecr_repository.storefront.arn,
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# ECS Service Update jogosultság
# -----------------------------------------------------------------------------
# A deploy utolsó lépése: az ECS service újraindítása az új image-gel.
# Az UpdateService --force-new-deployment újra pull-olja az image-et.
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_ecs" {
  name = "${var.project_name}-github-actions-ecs"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",    # Service újraindítása (force new deployment)
          "ecs:DescribeServices", # Service állapotának lekérdezése (wait-hez)
        ]
        Resource = [
          aws_ecs_service.api.id,
          aws_ecs_service.admin.id,
          aws_ecs_service.storefront.id,
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# IAM PassRole jogosultság
# -----------------------------------------------------------------------------
# Amikor az ECS service újraindul, az ECS-nek "fel kell vennie" az execution
# és task role-okat. Ehhez a GitHub Actions role-nak PassRole jogosultság kell
# ezekre a role-okra.
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_pass_role" {
  name = "${var.project_name}-github-actions-pass-role"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole",
        ]
        Resource = [
          aws_iam_role.ecs_execution_role.arn,
          aws_iam_role.ecs_task_role.arn,
        ]
      }
    ]
  })
}
