# =============================================================================
# iam.tf - IAM Role-ok és Policy-k (jogosultságok)
# =============================================================================
#
# Az IAM (Identity and Access Management) határozza meg, kinek mihez van joga.
#
# Az ECS-nek 2 különböző role kell:
#
# 1. Execution Role (végrehajtási szerepkör):
#    Az ECS "infrastruktúra" használja, MIELŐTT az alkalmazás elindul:
#    - Docker image letöltése az ECR-ből
#    - Log írása a CloudWatch-ba
#    - Secret-ek lekérése a Secrets Manager-ből (konténer induláskor)
#
# 2. Task Role (feladat szerepkör):
#    Maga az ALKALMAZÁS használja futás közben:
#    - S3-ba fájlok feltöltése/letöltése
#    - Secrets Manager olvasása (ha az app futás közben is kell)
#
# Analógia:
#   Execution Role = A futár, aki elhozza a csomagot (Docker image)
#   Task Role = Te magad, aki használja a csomag tartalmát (S3, Secrets)
# =============================================================================

# =============================================================================
# ECS Execution Role - Az ECS infrastruktúra jogosultságai
# =============================================================================

# -----------------------------------------------------------------------------
# Az Execution Role létrehozása
# -----------------------------------------------------------------------------
# Az "assume_role_policy" mondja meg, KI veheti fel ezt a role-t.
# Jelen esetben az ECS Tasks szolgáltatás (ecs-tasks.amazonaws.com).
# -----------------------------------------------------------------------------
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-execution-role"
  }
}

# -----------------------------------------------------------------------------
# AWS beépített ECS Execution policy csatolása
# -----------------------------------------------------------------------------
# Ez az AWS által előre definiált policy tartalmazza:
# - ECR: Docker image letöltés
# - CloudWatch Logs: log stream létrehozás és írás
# Nem kell kézzel definiálni, az AWS karbantartja.
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# -----------------------------------------------------------------------------
# Secrets Manager olvasási jogosultság (Execution Role-hoz)
# -----------------------------------------------------------------------------
# Az ECS-nek kell tudnia lekérni a secret-eket a konténer indításakor,
# hogy beinjektálja őket környezeti változóként.
# Az alapértelmezett ECS execution policy NEM tartalmazza a Secrets Manager-t!
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue", # Secret értékének lekérése
        ]
        # Csak a mi projektünk secret-jeit érheti el (nem mindent!)
        Resource = [
          aws_secretsmanager_secret.database_url.arn,
          aws_secretsmanager_secret.shopify_api_key.arn,
          aws_secretsmanager_secret.shopify_api_secret.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.encryption_key.arn,
        ]
      }
    ]
  })
}

# =============================================================================
# ECS Task Role - Az alkalmazás kód jogosultságai
# =============================================================================

# -----------------------------------------------------------------------------
# A Task Role létrehozása
# -----------------------------------------------------------------------------
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# -----------------------------------------------------------------------------
# S3 jogosultság - Fájlok feltöltése és letöltése
# -----------------------------------------------------------------------------
# Az alkalmazás (API) ezen a role-on keresztül tölti fel a fájlokat S3-ba.
# A jogosultságot CSAK a mi bucket-ünkre adjuk meg.
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.project_name}-ecs-task-s3"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",    # Fájl feltöltés
          "s3:GetObject",    # Fájl letöltés
          "s3:DeleteObject", # Fájl törlés
          "s3:ListBucket",   # Bucket tartalmának listázása
        ]
        Resource = [
          aws_s3_bucket.uploads.arn,       # A bucket maga (ListBucket-hez kell)
          "${aws_s3_bucket.uploads.arn}/*", # A bucket tartalma (Get/Put/Delete-hez)
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Secrets Manager olvasási jogosultság (Task Role-hoz)
# -----------------------------------------------------------------------------
# Ha az alkalmazás futás közben is kell, hogy olvasson secret-eket
# (nem csak induláskor), akkor a Task Role-nak is kell jogosultság.
# -----------------------------------------------------------------------------
resource "aws_iam_role_policy" "ecs_task_secrets" {
  name = "${var.project_name}-ecs-task-secrets"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = [
          aws_secretsmanager_secret.database_url.arn,
          aws_secretsmanager_secret.shopify_api_key.arn,
          aws_secretsmanager_secret.shopify_api_secret.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.encryption_key.arn,
        ]
      }
    ]
  })
}
