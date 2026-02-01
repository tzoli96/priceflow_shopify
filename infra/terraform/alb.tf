# =============================================================================
# alb.tf - Application Load Balancer + Routing szabályok
# =============================================================================
#
# Az ALB (Application Load Balancer) az alkalmazás "bejárati ajtaja".
# Egyetlen publikus URL-en érhető el, és az URL path alapján
# különböző háttérszolgáltatásokhoz irányítja a forgalmat.
#
# Routing logika:
#   /api/*        → API service (NestJS, port 4000)
#   /storefront/* → Storefront service (Next.js, port 3000)
#   /*            → Admin service (Next.js, port 3000) [default]
#
# A Target Group mondja meg az ALB-nek, hova továbbítsa a forgalmat.
# A Health Check rendszeresen ellenőrzi, hogy a háttérszolgáltatás működik-e.
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
# Az ALB a public subnetekben helyezkedik el (mert az internetről elérhető).
# Nem "internal" (belső), hanem "internet-facing" (kívülről elérhető).
# -----------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false          # Internet-facing (kívülről elérhető)
  load_balancer_type = "application"  # Layer 7 (HTTP/HTTPS) load balancer

  security_groups = [aws_security_group.alb.id]

  # Az ALB-t a public subnetekbe helyezzük
  subnets = [
    aws_subnet.public_1.id,
    aws_subnet.public_2.id,
  ]

  # Ha törölni akarod (terraform destroy), ne védje a törlés ellen
  # Production-ben érdemes true-ra állítani!
  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# =============================================================================
# Target Group-ok
# =============================================================================
# Minden szolgáltatásnak saját target group-ja van.
# A target group egy "csoport", amibe az ECS task-ok regisztrálják magukat.
# Az ALB a target group-on keresztül éri el a konténereket.
# =============================================================================

# -----------------------------------------------------------------------------
# API Target Group
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Fargate-nél "ip" kell (nem "instance"!)

  # Health check - az ALB rendszeresen "pingeli" a konténert
  # Ha a health check sikertelen, az ALB nem küld több forgalmat oda
  health_check {
    path                = "/api/health" # A NestJS health endpoint
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2   # Ennyi sikeres check után "egészséges"
    unhealthy_threshold = 3   # Ennyi sikertelen check után "nem egészséges"
    timeout             = 10  # Ha ennyi mp alatt nem válaszol, sikertelen
    interval            = 30  # Ellenőrzés gyakorisága (másodpercben)
    matcher             = "200" # Sikeres HTTP válaszkód
  }

  tags = {
    Name = "${var.project_name}-api-tg"
  }
}

# -----------------------------------------------------------------------------
# Admin Target Group
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "admin" {
  name        = "${var.project_name}-admin-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-admin-tg"
  }
}

# -----------------------------------------------------------------------------
# Storefront Target Group
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "storefront" {
  name        = "${var.project_name}-store-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-storefront-tg"
  }
}

# =============================================================================
# Listener és Routing szabályok
# =============================================================================
# A Listener "figyeli" a bejövő forgalmat egy adott porton.
# A Listener Rule-ok határozzák meg, hogy melyik forgalmat hova irányítsa.
# =============================================================================

# -----------------------------------------------------------------------------
# HTTP Listener (port 80)
# -----------------------------------------------------------------------------
# Kezdetben csak HTTP-t használunk.
# Ha HTTPS-t is szeretnél (ajánlott!), kell egy SSL tanúsítvány (ACM),
# és egy HTTPS listener (port 443), ami HTTPS-re irányítja a HTTP forgalmat.
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Default action: ha nincs egyező szabály, az Admin-ra irányít
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin.arn
  }

  tags = {
    Name = "${var.project_name}-http-listener"
  }
}

# -----------------------------------------------------------------------------
# Routing Rule: /api/* → API Service
# -----------------------------------------------------------------------------
# Minden /api-val kezdődő kérést az API target group-ba irányítunk.
# A priority (prioritás) határozza meg a szabályok kiértékelési sorrendjét:
# alacsonyabb szám = magasabb prioritás.
# -----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100 # Először ezt vizsgálja

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/api"] # Minden /api-val kezdődő URL
    }
  }

  tags = {
    Name = "${var.project_name}-api-rule"
  }
}

# -----------------------------------------------------------------------------
# Routing Rule: /storefront/* → Storefront Service
# -----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "storefront" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 200 # Másodikként vizsgálja

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.storefront.arn
  }

  condition {
    path_pattern {
      values = ["/storefront/*", "/storefront"]
    }
  }

  tags = {
    Name = "${var.project_name}-storefront-rule"
  }
}

# Megjegyzés: Az Admin-hoz nem kell külön rule, mert az a default action
# a HTTP listener-ben (/* → Admin). Tehát minden, ami nem /api/* és nem
# /storefront/*, az automatikusan az Admin-ra megy.
