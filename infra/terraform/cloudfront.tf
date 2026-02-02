# =============================================================================
# cloudfront.tf - CloudFront Distribution az ALB elé (HTTPS)
# =============================================================================
#
# CloudFront CDN-t használunk, hogy HTTPS-t biztosítsunk saját domain és
# ACM tanúsítvány nélkül. A *.cloudfront.net URL automatikusan HTTPS-es.
#
# Architektúra:
#   Felhasználók --HTTPS--> CloudFront --HTTP--> ALB --HTTP--> ECS
#
# A cache ki van kapcsolva, mert ez egy dinamikus alkalmazás (SSR + API).
# =============================================================================

# -----------------------------------------------------------------------------
# Cache Policy - Cache kikapcsolva
# -----------------------------------------------------------------------------
# Dinamikus alkalmazásnál nem akarunk cache-elni (API válaszok, SSR oldalak).
# Minden kérés továbbmegy az origin-hoz (ALB).
# -----------------------------------------------------------------------------
resource "aws_cloudfront_cache_policy" "disabled" {
  name        = "${var.project_name}-no-cache"
  comment     = "Cache kikapcsolva - dinamikus alkalmazás"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# -----------------------------------------------------------------------------
# Origin Request Policy - Minden továbbítása az ALB-nek
# -----------------------------------------------------------------------------
# Biztosítja, hogy minden header, cookie és query string eljut az ALB-hez,
# így az alkalmazás pontosan úgy kapja a kéréseket, mintha közvetlenül jönnének.
# -----------------------------------------------------------------------------
resource "aws_cloudfront_origin_request_policy" "forward_all" {
  name    = "${var.project_name}-forward-all"
  comment = "Minden header, cookie és query string továbbítása"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "allViewer"
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

# -----------------------------------------------------------------------------
# CloudFront Distribution
# -----------------------------------------------------------------------------
# A fő distribution, ami HTTPS-t biztosít a *.cloudfront.net domain-en.
# Az ALB a HTTP origin, a CloudFront kezeli az HTTPS terminálást.
# -----------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "main" {
  comment         = "${var.project_name} - HTTPS via CloudFront"
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100" # Európa + Észak-Amerika (legolcsóbb)

  # Origin: az ALB (HTTP-n keresztül)
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # CloudFront → ALB HTTP-n megy
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior - minden kérést az ALB-hez továbbít
  default_cache_behavior {
    target_origin_id = "alb"

    # Minden HTTP metódus engedélyezve (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
    allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    cached_methods  = ["GET", "HEAD"]

    # Cache kikapcsolva, minden továbbítva
    cache_policy_id          = aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.forward_all.id

    viewer_protocol_policy = "redirect-to-https" # HTTP → HTTPS átirányítás
    compress               = true                 # Gzip/Brotli tömörítés
  }

  # Nincs geo restriction
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # CloudFront default tanúsítvány (*.cloudfront.net) - nincs saját domain szükség
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cloudfront"
  }
}
