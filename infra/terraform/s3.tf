# =============================================================================
# s3.tf - S3 Bucket (fájl tároló)
# =============================================================================
#
# Az S3 (Simple Storage Service) az AWS fájl tároló szolgáltatása.
# Ide kerülnek a feltöltött fájlok (képek, dokumentumok, stb.).
#
# Fontos fogalmak:
#   Bucket    = A "mappa" legfelső szintje (globálisan egyedi névvel)
#   Object    = Egy fájl a bucket-ben
#   ACL       = Access Control List (hozzáférés-szabályozás, már elavult)
#   Policy    = JSON formátumú jogosultság szabály
#   CORS      = Cross-Origin Resource Sharing (böngészőből való hozzáférés)
#
# A fájlok publikusan elérhetőek lesznek (olvasásra), mert a storefront
# közvetlenül az S3 URL-ről tölti le a képeket.
# =============================================================================

# -----------------------------------------------------------------------------
# S3 Bucket
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "uploads" {
  # A bucket név globálisan egyedi kell legyen az egész AWS-ben!
  # Ezért a projekt nevet és a fiók ID-t is beletesszük.
  bucket = "${var.project_name}-uploads-${data.aws_caller_identity.current.account_id}"

  # Production-ben állítsd true-ra, hogy ne lehessen véletlenül törölni!
  force_destroy = true # Fejlesztéskor engedélyezzük a törlést (objektumokkal együtt)

  tags = {
    Name = "${var.project_name}-uploads"
  }
}

# -----------------------------------------------------------------------------
# Publikus hozzáférés beállítások
# -----------------------------------------------------------------------------
# Az AWS alapértelmezés szerint BLOKKOLJA a publikus hozzáférést (ez jó!).
# De mi szeretnénk, ha a feltöltött képek publikusan elérhetőek lennének,
# ezért feloldjuk a blokkolást.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = false # ACL-eket nem blokkoljuk
  block_public_policy     = false # Policy-kat nem blokkoljuk
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# -----------------------------------------------------------------------------
# Bucket Policy - Olvasási jogosultság mindenkinek
# -----------------------------------------------------------------------------
# Ez a policy lehetővé teszi, hogy bárki (az internetről) olvashassa a
# bucket tartalmát. Ez szükséges, mert a böngésző közvetlenül az S3 URL-ről
# tölti le a képeket.
#
# FONTOS: Csak olvasási (GetObject) jogot adunk, írást NEM!
# A feltöltést az alkalmazás végzi az IAM role-on keresztül.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "uploads_public_read" {
  bucket = aws_s3_bucket.uploads.id

  # Megvárjuk, amíg a public access block beállítás érvénybe lép
  depends_on = [aws_s3_bucket_public_access_block.uploads]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"              # Bárki
        Action    = "s3:GetObject"   # Csak olvasás
        Resource  = "${aws_s3_bucket.uploads.arn}/*" # Minden fájlra
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CORS konfiguráció - Böngészőből való hozzáférés
# -----------------------------------------------------------------------------
# A CORS (Cross-Origin Resource Sharing) szükséges ahhoz, hogy a böngésző
# egy másik domain-ról (pl. a storefront-ról) hozzáférhessen az S3 fájlokhoz.
# Nélküle a böngésző blokkokná a kéréseket biztonsági okokból.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]                         # Bármilyen HTTP header
    allowed_methods = ["GET", "PUT", "POST", "HEAD"] # GET: letöltés, PUT/POST: feltöltés
    allowed_origins = ["*"]                          # Bármilyen domain (élesben szűkítsd!)
    expose_headers  = ["ETag"]                       # Az ETag szükséges a multipart upload-hoz
    max_age_seconds = 3600                           # CORS preflight cache: 1 óra
  }
}

# -----------------------------------------------------------------------------
# Verziókezelés (opcionális, de ajánlott)
# -----------------------------------------------------------------------------
# Ha bekapcsolod, a törölt vagy felülírt fájlok korábbi verziói megmaradnak.
# Ez extra tárhelyet fogyaszt, de véd a véletlen törlés ellen.
# Kezdetben kikapcsoljuk a költségek miatt.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Disabled" # Költségtakarékosság - élesben "Enabled" ajánlott
  }
}
