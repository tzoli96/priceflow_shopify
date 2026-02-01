# =============================================================================
# rds.tf - RDS PostgreSQL adatbázis
# =============================================================================
#
# Az RDS (Relational Database Service) egy felügyelt adatbázis szolgáltatás.
# Az AWS kezeli a backup-okat, patch-eket és a magas rendelkezésre állást.
# Neked csak az alkalmazásod kódját kell kezelned.
#
# Miért RDS és nem saját PostgreSQL EC2-n?
#   - Automatikus napi backup
#   - Automatikus szoftver frissítések
#   - Monitoring és riasztások
#   - Multi-AZ failover (opcionális)
#   - Nem kell szerver adminisztrációval foglalkozni
#
# A db.t3.micro az AWS Free Tier része: 750 óra/hó ingyenes az első évben.
# =============================================================================

# -----------------------------------------------------------------------------
# DB Subnet Group
# -----------------------------------------------------------------------------
# Az RDS-nek meg kell mondani, melyik subnetekben hozhatja létre az adatbázist.
# Legalább 2 különböző AZ-ban lévő subnet kell (Multi-AZ támogatáshoz).
# Akkor is kell 2, ha nem használunk Multi-AZ-t, mert az AWS megköveteli.
# -----------------------------------------------------------------------------
resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-db-subnet-group"
  description = "Private subnetek az RDS-hez"

  # Az adatbázis a private subnetekben lesz (nem érhető el közvetlenül az internetről)
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id,
  ]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL Instance
# -----------------------------------------------------------------------------
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db" # Az RDS instance egyedi neve

  # Motor beállítások
  engine         = "postgres"
  engine_version = "16"         # PostgreSQL 16 (legújabb stabil)
  instance_class = var.db_instance_class # db.t3.micro (Free Tier)

  # Tárhely
  allocated_storage     = 20    # Kezdeti méret (GB)
  max_allocated_storage = 100   # Autoscaling maximum (GB)
  storage_type          = "gp3" # General Purpose SSD (legújabb generáció)
  storage_encrypted     = true  # Titkosított tárhely (AES-256)

  # Adatbázis és hitelesítés
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Hálózat
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # NEM érhető el az internetről!

  # Backup beállítások
  backup_retention_period = 1          # 1 napig tartjuk meg a backup-okat (Free Tier limit)
  backup_window           = "03:00-04:00" # Hajnali 3-4 között készül a backup (UTC)
  maintenance_window      = "Mon:04:00-Mon:05:00" # Karbantartás hétfőn hajnali 4-5 (UTC)

  # Egyéb beállítások
  multi_az               = false # Kezdetben nem kell Multi-AZ (drágább)
  skip_final_snapshot    = true  # Törléskor ne készítsen végső snapshot-ot (fejlesztéshez)
  deletion_protection    = false # Production-ben állítsd true-ra!
  auto_minor_version_upgrade = true # Automatikus minor verzió frissítés

  # Performance Insights - lekérdezés teljesítmény monitoring
  performance_insights_enabled = false # Free Tier-ben kikapcsoljuk

  tags = {
    Name = "${var.project_name}-db"
  }
}
