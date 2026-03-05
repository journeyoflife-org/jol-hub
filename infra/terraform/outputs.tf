# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = module.vpc.database_subnet_ids
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------

output "db_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.database.db_instance_endpoint
  sensitive   = true
}

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = module.database.db_secret_arn
}

# -----------------------------------------------------------------------------
# ElastiCache Outputs
# -----------------------------------------------------------------------------

output "redis_endpoint" {
  description = "Primary endpoint address of the Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "redis_secret_arn" {
  description = "ARN of the Redis credentials secret"
  value       = module.elasticache.redis_secret_arn
}

# -----------------------------------------------------------------------------
# Storage Outputs
# -----------------------------------------------------------------------------

output "s3_bucket_arn" {
  description = "ARN of the S3 media bucket"
  value       = module.storage.s3_bucket_arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.storage.cloudfront_domain_name
}

# -----------------------------------------------------------------------------
# ECS Outputs
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecr_repository_url" {
  description = "URL of the Django ECR repository"
  value       = module.ecs.ecr_repository_url
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "django_service_name" {
  description = "Name of the Django ECS service"
  value       = module.ecs.django_service_name
}

# -----------------------------------------------------------------------------
# Application URLs
# -----------------------------------------------------------------------------

output "app_url" {
  description = "URL of the application"
  value       = var.app_domain != "" ? "https://${var.app_domain}" : "https://${module.ecs.alb_dns_name}"
}

output "cdn_url" {
  description = "URL of the CloudFront CDN"
  value       = "https://${module.storage.cloudfront_domain_name}"
}
