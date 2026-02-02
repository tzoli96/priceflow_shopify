# =============================================================================
# outputs.tf - Terraform kimenetek (Outputs)
# =============================================================================
#
# Az output-ok a `terraform apply` végén kiírt értékek.
# Ezeket később használhatod:
#   - `terraform output` paranccsal bármikor megtekintheted
#   - Más Terraform modulok hivatkozhatnak rájuk
#   - CI/CD pipeline-ban felhasználhatod (pl. deploy scriptben)
#
# A `sensitive = true` megakadályozza, hogy a Terraform kiírja a konzolra
# (pl. adatbázis jelszó). Ilyenkor `terraform output -raw <név>` kell.
# =============================================================================

# -----------------------------------------------------------------------------
# ALB (Load Balancer) kimenetek
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  description = "Az ALB publikus DNS neve - ezen érhető el az alkalmazás"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "Az alkalmazás URL-je (HTTP)"
  value       = "http://${aws_lb.main.dns_name}"
}

# -----------------------------------------------------------------------------
# RDS (Adatbázis) kimenetek
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "Az RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_hostname" {
  description = "Az RDS hostname (port nélkül)"
  value       = aws_db_instance.main.address
}

# -----------------------------------------------------------------------------
# S3 kimenetek
# -----------------------------------------------------------------------------

output "s3_bucket_name" {
  description = "Az S3 bucket neve (feltöltésekhez)"
  value       = aws_s3_bucket.uploads.id
}

output "s3_bucket_url" {
  description = "Az S3 bucket publikus URL-je"
  value       = "https://${aws_s3_bucket.uploads.bucket_regional_domain_name}"
}

# -----------------------------------------------------------------------------
# ECR (Docker Registry) kimenetek
# -----------------------------------------------------------------------------

output "ecr_api_url" {
  description = "ECR repository URL az API image-hez"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_admin_url" {
  description = "ECR repository URL az Admin image-hez"
  value       = aws_ecr_repository.admin.repository_url
}

output "ecr_storefront_url" {
  description = "ECR repository URL a Storefront image-hez"
  value       = aws_ecr_repository.storefront.repository_url
}

# -----------------------------------------------------------------------------
# ECS kimenetek
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "Az ECS cluster neve"
  value       = aws_ecs_cluster.main.name
}

# -----------------------------------------------------------------------------
# VPC kimenetek (hasznos debug-oláshoz)
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "A VPC azonosítója"
  value       = aws_vpc.main.id
}

# -----------------------------------------------------------------------------
# CloudFront kimenetek
# -----------------------------------------------------------------------------

output "cloudfront_domain_name" {
  description = "A CloudFront distribution domain neve (*.cloudfront.net)"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_url" {
  description = "Az alkalmazás URL-je (HTTPS, CloudFront-on keresztül)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "A CloudFront distribution azonosítója (cache invalidáláshoz)"
  value       = aws_cloudfront_distribution.main.id
}
