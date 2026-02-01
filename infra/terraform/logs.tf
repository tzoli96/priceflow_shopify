# =============================================================================
# logs.tf - CloudWatch Log Group-ok
# =============================================================================
#
# A CloudWatch Logs az AWS naplózó szolgáltatása.
# Minden ECS konténer ide írja a stdout/stderr kimenetét.
#
# Hierarchia:
#   Log Group     = Logikai csoportosítás (pl. /ecs/priceflow-api)
#   └── Log Stream = Egy konkrét konténer instance naplója
#       └── Log Events = Az egyes naplóbejegyzések
#
# A retention_in_days határozza meg, mennyi ideig őrizzük meg a logokat.
# 30 nap egy jó kompromisszum a költségek és a hibakeresés között.
#
# Logok megtekintése:
#   - AWS Console → CloudWatch → Log groups
#   - AWS CLI: aws logs tail /ecs/priceflow-api --follow
# =============================================================================

# -----------------------------------------------------------------------------
# API Log Group
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api"
  retention_in_days = 30 # 30 nap után automatikusan törlődnek a logok

  tags = {
    Name    = "${var.project_name}-api-logs"
    Service = "api"
  }
}

# -----------------------------------------------------------------------------
# Admin Log Group
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "admin" {
  name              = "/ecs/${var.project_name}-admin"
  retention_in_days = 30

  tags = {
    Name    = "${var.project_name}-admin-logs"
    Service = "admin"
  }
}

# -----------------------------------------------------------------------------
# Storefront Log Group
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "storefront" {
  name              = "/ecs/${var.project_name}-storefront"
  retention_in_days = 30

  tags = {
    Name    = "${var.project_name}-storefront-logs"
    Service = "storefront"
  }
}
