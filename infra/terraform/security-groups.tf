# =============================================================================
# security-groups.tf - Tűzfal szabályok (Security Groups)
# =============================================================================
#
# A Security Group (SG) az AWS virtuális tűzfala.
# Minden erőforráshoz (ALB, ECS, RDS) hozzárendelünk egy SG-t,
# ami meghatározza, milyen forgalom engedélyezett BE és KI.
#
# Forgalom irány:
#   Ingress = bejövő forgalom (valaki kapcsolódik hozzánk)
#   Egress  = kimenő forgalom (mi kapcsolódunk valahova)
#
# Biztonsági elv: "Least Privilege" - csak azt engedélyezzük, ami kell.
#
# Kapcsolat lánc:
#   Internet → ALB SG (80/443) → ECS SG (3000/4000) → RDS SG (5432)
#
# Tehát:
#   - Az internet csak az ALB-t éri el
#   - Az ECS-t csak az ALB éri el
#   - Az RDS-t csak az ECS éri el
# =============================================================================

# -----------------------------------------------------------------------------
# ALB Security Group - A Load Balancer tűzfala
# -----------------------------------------------------------------------------
# Az ALB az egyetlen publikusan elérhető erőforrás.
# Bejövő: HTTP (80) és HTTPS (443) mindenhonnan
# Kimenő: minden (mert továbbítja a forgalmat az ECS felé)
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "ALB security group - HTTP/HTTPS forgalom az internetrol"
  vpc_id      = aws_vpc.main.id

  # Bejövő HTTP forgalom (port 80) - bárhonnan
  ingress {
    description = "HTTP az internetrol"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # 0.0.0.0/0 = mindenhonnan
  }

  # Bejövő HTTPS forgalom (port 443) - bárhonnan
  ingress {
    description = "HTTPS az internetrol"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kimenő forgalom - mindenhova engedélyezve
  # Az ALB-nek el kell érnie az ECS konténereket a private subnetben
  egress {
    description = "Minden kimeno forgalom"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"          # -1 = minden protokoll (TCP, UDP, ICMP, stb.)
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }

  # A name_prefix + lifecycle biztosítja, hogy Terraform frissítéskor
  # először létrehozza az újat, aztán törli a régit (zero downtime)
  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# ECS Security Group - Az alkalmazás konténerek tűzfala
# -----------------------------------------------------------------------------
# Az ECS konténerek NEM érhetőek el közvetlenül az internetről.
# Csak az ALB-ről érkező forgalmat engedélyezzük.
# Kimenő: minden (mert az alkalmazásnak el kell érnie az RDS-t, S3-at, stb.)
# -----------------------------------------------------------------------------
resource "aws_security_group" "ecs" {
  name_prefix = "${var.project_name}-ecs-"
  description = "ECS security group - csak ALB-rol erkezo forgalom"
  vpc_id      = aws_vpc.main.id

  # Bejövő forgalom az ALB-ről a Storefront és Admin portjára
  ingress {
    description     = "Storefront/Admin port az ALB-rol"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id] # CSAK az ALB SG-ból!
  }

  # Bejövő forgalom az ALB-ről az API portjára
  ingress {
    description     = "API port az ALB-rol"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Kimenő forgalom - mindenhova
  # Kell az RDS eléréséhez, S3-hoz, ECR-hez (image pull), CloudWatch-hoz, stb.
  egress {
    description = "Minden kimeno forgalom"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# RDS Security Group - Az adatbázis tűzfala
# -----------------------------------------------------------------------------
# A legvédettebb erőforrás: CSAK az ECS konténerek érhetik el.
# Sem az internet, sem az ALB nem csatlakozhat közvetlenül az adatbázishoz.
# -----------------------------------------------------------------------------
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "RDS security group - csak ECS-bol erkezo forgalom"
  vpc_id      = aws_vpc.main.id

  # Bejövő PostgreSQL forgalom CSAK az ECS konténerekből
  ingress {
    description     = "PostgreSQL az ECS-bol"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id] # CSAK az ECS SG-ból!
  }

  # Kimenő forgalom - általában nem kell, de az AWS ajánlja
  egress {
    description = "Minden kimeno forgalom"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}
