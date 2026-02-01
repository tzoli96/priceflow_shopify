# =============================================================================
# ecs.tf - ECS Cluster, Task Definitions és Services
# =============================================================================
#
# ECS (Elastic Container Service) = AWS konténer-futtató szolgáltatás
#
# Fogalmak:
#   Cluster     = A konténerek "otthona", logikai csoportosítás
#   Task Def    = A konténer "receptje" (milyen image, mennyi CPU/RAM, env vars)
#   Service     = Biztosítja, hogy mindig fusson X darab task (konténer)
#   Fargate     = Szerver nélküli futtatás (nem kell EC2-t kezelni)
#
# Felépítés:
#   ECS Cluster
#   ├── Service: API        → Task: NestJS (port 4000)
#   ├── Service: Admin      → Task: Next.js (port 3000)
#   └── Service: Storefront → Task: Next.js (port 3000)
# =============================================================================

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------
# A cluster önmagában nem kerül pénzbe, csak a benne futó task-ok.
# A Container Insights extra monitoring-ot ad (CPU, memória grafikonok),
# de ez is extra költséggel jár.
# -----------------------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled" # CloudWatch Container Insights bekapcsolása
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# =============================================================================
# Task Definition-ök
# =============================================================================
# A Task Definition a konténer "receptje":
# - Melyik Docker image-et használja
# - Mennyi CPU és memória kell
# - Milyen portot nyit ki
# - Milyen környezeti változókat kap
# - Milyen titkokat olvashat a Secrets Manager-ből
# =============================================================================

# -----------------------------------------------------------------------------
# API Task Definition
# -----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "api" {
  family = "${var.project_name}-api" # A task definition "neve"

  # Fargate = szerver nélküli, nem kell EC2-t kezelni
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc" # Fargate-nél kötelező - minden task saját IP-t kap

  # CPU és memória a task szintjén (nem konténer szintjén)
  cpu    = var.api_cpu
  memory = var.api_memory

  # Execution role: az ECS ügynök (agent) használja ECR pull-hoz, log íráshoz
  execution_role_arn = aws_iam_role.ecs_execution_role.arn
  # Task role: maga az alkalmazás használja (S3, Secrets Manager hozzáférés)
  task_role_arn = aws_iam_role.ecs_task_role.arn

  # Konténer definíció JSON formátumban
  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-api"
      image = "${aws_ecr_repository.api.repository_url}:latest"

      # Port mapping - a konténer belső portja
      portMappings = [
        {
          containerPort = 4000 # A NestJS ezen a porton fut
          protocol      = "tcp"
        }
      ]

      # Környezeti változók (nem érzékeny adatok)
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "4000" },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "AWS_S3_BUCKET", value = aws_s3_bucket.uploads.id },
        { name = "AWS_S3_REGION", value = var.aws_region },
        { name = "HOST", value = aws_lb.main.dns_name },
        { name = "API_URL", value = "http://${aws_lb.main.dns_name}/api" },
        { name = "SHOP_URL", value = var.shop_url },
        { name = "SHOPIFY_ORGANIZATION_ID", value = var.shopify_organization_id },
        { name = "EMBEDDED_APP_URL", value = "http://${aws_lb.main.dns_name}" },
        { name = "WIDGET_APP_URL", value = "http://${aws_lb.main.dns_name}/storefront" },
      ]

      # Titkos környezeti változók a Secrets Manager-ből
      # Az ECS automatikusan lekéri és beinjektálja ezeket
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.database_url.arn
        },
        {
          name      = "SHOPIFY_API_KEY"
          valueFrom = aws_secretsmanager_secret.shopify_api_key.arn
        },
        {
          name      = "SHOPIFY_API_SECRET"
          valueFrom = aws_secretsmanager_secret.shopify_api_secret.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = aws_secretsmanager_secret.encryption_key.arn
        },
      ]

      # CloudWatch logolás beállítása
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      # Ha a konténer leáll, az ECS automatikusan újraindítja (a service miatt)
      essential = true
    }
  ])

  tags = {
    Name = "${var.project_name}-api-task"
  }
}

# -----------------------------------------------------------------------------
# Admin Task Definition
# -----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "admin" {
  family                   = "${var.project_name}-admin"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.admin_cpu
  memory                   = var.admin_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-admin"
      image = "${aws_ecr_repository.admin.repository_url}:latest"

      portMappings = [
        {
          containerPort = 3000 # A Next.js ezen fut
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        # Az API elérhetősége az ALB-n keresztül
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = "http://${aws_lb.main.dns_name}/api"
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.admin.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = {
    Name = "${var.project_name}-admin-task"
  }
}

# -----------------------------------------------------------------------------
# Storefront Task Definition
# -----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "storefront" {
  family                   = "${var.project_name}-storefront"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.storefront_cpu
  memory                   = var.storefront_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-storefront"
      image = "${aws_ecr_repository.storefront.repository_url}:latest"

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = "http://${aws_lb.main.dns_name}/api"
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.storefront.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    }
  ])

  tags = {
    Name = "${var.project_name}-storefront-task"
  }
}

# =============================================================================
# ECS Services
# =============================================================================
# A Service biztosítja, hogy mindig fusson a megadott számú task (konténer).
# Ha egy task leáll vagy hibás lesz, a service automatikusan újat indít.
# A service köti össze a task-ot az ALB target group-pal is.
# =============================================================================

# -----------------------------------------------------------------------------
# API Service
# -----------------------------------------------------------------------------
resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count # Hány task fusson (default: 1)
  launch_type     = "FARGATE"

  # Hálózati konfiguráció - melyik subnetbe kerüljenek a konténerek
  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false # Private subnetben vagyunk, nem kell publikus IP
  }

  # ALB összekapcsolás - a forgalmat az ALB továbbítja ide
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "${var.project_name}-api"
    container_port   = 4000
  }


  # Megvárjuk, amíg az ALB listener rule-ok elkészülnek
  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "${var.project_name}-api-service"
  }
}

# -----------------------------------------------------------------------------
# Admin Service
# -----------------------------------------------------------------------------
resource "aws_ecs_service" "admin" {
  name            = "${var.project_name}-admin"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin.arn
  desired_count   = var.admin_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.admin.arn
    container_name   = "${var.project_name}-admin"
    container_port   = 3000
  }


  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "${var.project_name}-admin-service"
  }
}

# -----------------------------------------------------------------------------
# Storefront Service
# -----------------------------------------------------------------------------
resource "aws_ecs_service" "storefront" {
  name            = "${var.project_name}-storefront"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.storefront.arn
  desired_count   = var.storefront_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.storefront.arn
    container_name   = "${var.project_name}-storefront"
    container_port   = 3000
  }


  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "${var.project_name}-storefront-service"
  }
}
