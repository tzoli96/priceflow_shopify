# =============================================================================
# vpc.tf - Hálózati infrastruktúra (VPC, Subnetek, Gateway-ek)
# =============================================================================
#
# A VPC (Virtual Private Cloud) egy izolált virtuális hálózat az AWS-ben.
# Gondolj rá úgy, mint a saját "adatközpontodra" a felhőben.
#
# Felépítés:
#
#   VPC (10.0.0.0/16) - az egész hálózat, 65536 IP cím
#   ├── Public Subnet 1  (10.0.1.0/24) - AZ "a" - 256 IP
#   ├── Public Subnet 2  (10.0.2.0/24) - AZ "b" - 256 IP
#   ├── Private Subnet 1 (10.0.10.0/24) - AZ "a" - 256 IP
#   └── Private Subnet 2 (10.0.10.0/24) - AZ "b" - 256 IP
#
# Miért 2-2 subnet?
#   Az AWS megköveteli, hogy az ALB (Load Balancer) és az RDS legalább
#   2 különböző Availability Zone-ban (AZ) legyen. Ez biztosítja a
#   magas rendelkezésre állást: ha az egyik AZ meghibásodik, a másik
#   még működik.
#
# Public vs Private subnet:
#   - Public: közvetlen internet-hozzáférés (ALB ide kerül)
#   - Private: nincs közvetlen internet, csak NAT-on keresztül (ECS, RDS ide kerül)
#   Ez a biztonság miatt fontos: az adatbázis és az alkalmazás nem érhető el
#   közvetlenül az internetről.
# =============================================================================

# -----------------------------------------------------------------------------
# Availability Zone-ok lekérdezése
# -----------------------------------------------------------------------------
# Ez egy "data source" - nem hoz létre semmit, csak lekérdezi az AWS-ből
# az elérhető AZ-okat az adott régióban.
# Pl. eu-central-1a, eu-central-1b, eu-central-1c
# -----------------------------------------------------------------------------
data "aws_availability_zones" "available" {
  state = "available" # Csak a működő AZ-okat kérjük le
}

# -----------------------------------------------------------------------------
# VPC - A fő hálózat
# -----------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16" # IP tartomány: 10.0.0.0 - 10.0.255.255

  # DNS támogatás kell az ECS service discovery-hez és az RDS endpoint-hoz
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# -----------------------------------------------------------------------------
# Public Subnetek - Ide kerül az ALB (Load Balancer) és a NAT Gateway
# -----------------------------------------------------------------------------
# A public subnet azért "publikus", mert az Internet Gateway-hez van routolva,
# tehát az itt lévő erőforrások közvetlenül elérhetőek az internetről
# (ha a security group megengedi).
# -----------------------------------------------------------------------------

resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"                         # 256 IP cím
  availability_zone = data.aws_availability_zones.available.names[0] # pl. eu-central-1a

  # Az itt indított EC2/ECS instance-ok automatikusan kapnak publikus IP-t
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-1"
    Tier = "public" # Saját tag, hogy könnyen szűrhessünk
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1] # pl. eu-central-1b

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-2"
    Tier = "public"
  }
}

# -----------------------------------------------------------------------------
# Private Subnetek - Ide kerül az ECS (alkalmazások) és az RDS (adatbázis)
# -----------------------------------------------------------------------------
# A private subnet NEM érhető el közvetlenül az internetről.
# Ha az itt lévő erőforrásoknak kell internet (pl. Docker image letöltés),
# azt a NAT Gateway-en keresztül érik el.
# -----------------------------------------------------------------------------

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.project_name}-private-1"
    Tier = "private"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${var.project_name}-private-2"
    Tier = "private"
  }
}

# -----------------------------------------------------------------------------
# Internet Gateway - A VPC "kapuja" az internet felé
# -----------------------------------------------------------------------------
# Nélküle semmi nem lenne elérhető az internetről (és fordítva).
# Csak a public subnetekhez van hozzárendelve (a route table-ön keresztül).
# -----------------------------------------------------------------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# -----------------------------------------------------------------------------
# Elastic IP a NAT Gateway-hez
# -----------------------------------------------------------------------------
# A NAT Gateway-nek kell egy fix publikus IP cím (Elastic IP).
# Ez a cím nem változik, amíg nem töröljük - fontos, ha whitelist-elni
# kell valahol a kimenő forgalmat.
# -----------------------------------------------------------------------------
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
  }

  # Az EIP csak az IGW létrejötte után hozható létre
  depends_on = [aws_internet_gateway.main]
}

# -----------------------------------------------------------------------------
# NAT Gateway - A private subnet "internet kapuja"
# -----------------------------------------------------------------------------
# A NAT (Network Address Translation) Gateway lehetővé teszi, hogy a
# private subnetben lévő erőforrások (ECS konténerek) elérjék az internetet
# (pl. Docker image letöltés, külső API hívások), DE az internet felől
# NEM érhetőek el közvetlenül.
#
# FONTOS: A NAT Gateway az egyik legdrágább AWS szolgáltatás kis projekteknél!
# ~$32/hó + adatforgalmi díj. Ha spórolni akarsz, használhatsz VPC Endpoint-okat
# az ECR/S3/CloudWatch eléréséhez NAT nélkül.
# -----------------------------------------------------------------------------
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id # A NAT GW-nek public subnetben KELL lennie

  tags = {
    Name = "${var.project_name}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# -----------------------------------------------------------------------------
# Route Table-ök - Forgalom irányítás
# -----------------------------------------------------------------------------
# A route table mondja meg, hogy egy subnet-ből hova menjen a forgalom.
# Gondolj rá úgy, mint egy jelzőtáblára az autópálya elágazásánál.
# -----------------------------------------------------------------------------

# Public Route Table - minden forgalom az Internet Gateway-en keresztül megy ki
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"          # Minden cél (= internet)
    gateway_id = aws_internet_gateway.main.id # Az IGW-n keresztül
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Private Route Table - a kimenő internet forgalom a NAT Gateway-en megy
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id # A NAT GW-n keresztül
  }

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

# -----------------------------------------------------------------------------
# Route Table hozzárendelések (Associations)
# -----------------------------------------------------------------------------
# Minden subnetet hozzárendelünk a megfelelő route table-höz.
# Ha nem rendelnénk hozzá, a VPC alapértelmezett route table-je lenne érvényes.
# -----------------------------------------------------------------------------

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}
