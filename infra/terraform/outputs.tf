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

# -----------------------------------------------------------------------------
# EKS Outputs
# -----------------------------------------------------------------------------

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = var.enable_eks ? module.eks[0].cluster_name : null
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = var.enable_eks ? module.eks[0].cluster_endpoint : null
}

output "eks_cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = var.enable_eks ? module.eks[0].cluster_version : null
}

output "eks_kubectl_config" {
  description = "kubectl configuration command"
  value       = var.enable_eks ? module.eks[0].kubectl_config : null
}

# -----------------------------------------------------------------------------
# Monitoring Outputs
# -----------------------------------------------------------------------------

output "prometheus_endpoint" {
  description = "Endpoint of the Prometheus workspace"
  value       = var.enable_monitoring ? module.monitoring[0].prometheus_endpoint : null
}

output "grafana_endpoint" {
  description = "Endpoint of the Grafana workspace"
  value       = var.enable_monitoring ? module.monitoring[0].grafana_endpoint : null
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = var.enable_monitoring ? module.monitoring[0].cloudwatch_dashboard_name : null
}

# -----------------------------------------------------------------------------
# Logging Outputs
# -----------------------------------------------------------------------------

output "opensearch_endpoint" {
  description = "Endpoint of the OpenSearch domain"
  value       = var.enable_logging ? module.logging[0].opensearch_endpoint : null
}

output "opensearch_dashboard_endpoint" {
  description = "Dashboard endpoint of the OpenSearch domain"
  value       = var.enable_logging ? module.logging[0].opensearch_dashboard_endpoint : null
}

# -----------------------------------------------------------------------------
# Secrets Management Outputs
# -----------------------------------------------------------------------------

output "secrets_kms_key_arn" {
  description = "ARN of the KMS key for secrets encryption"
  value       = module.secrets.secrets_kms_key_arn
}

output "django_secret_arn" {
  description = "ARN of the Django secret key"
  value       = module.secrets.django_secret_arn
}

output "database_url_secret_arn" {
  description = "ARN of the database URL secret"
  value       = module.secrets.database_url_secret_arn
}

output "stripe_secret_arn" {
  description = "ARN of the Stripe keys secret (PCI-DSS scoped)"
  value       = module.secrets.stripe_secret_arn
}

output "paypal_secret_arn" {
  description = "ARN of the PayPal credentials secret (PCI-DSS scoped)"
  value       = module.secrets.paypal_secret_arn
}

output "email_secret_arn" {
  description = "ARN of the email credentials secret"
  value       = module.secrets.email_secret_arn
}

output "bitrix24_secret_arn" {
  description = "ARN of the Bitrix24 credentials secret"
  value       = module.secrets.bitrix24_secret_arn
}

output "nextauth_secret_arn" {
  description = "ARN of the NextAuth.js secret"
  value       = module.secrets.nextauth_secret_arn
}

output "encryption_keys_secret_arn" {
  description = "ARN of the encryption keys secret (GDPR Art. 32)"
  value       = module.secrets.encryption_keys_secret_arn
}

output "secrets_read_policy_arn" {
  description = "ARN of the IAM policy for reading application secrets"
  value       = module.secrets.secrets_read_policy_arn
}

output "secrets_pci_read_policy_arn" {
  description = "ARN of the IAM policy for reading PCI-DSS secrets"
  value       = module.secrets.secrets_pci_read_policy_arn
}

output "all_secrets_map" {
  description = "Map of all secret names to their ARNs"
  value       = module.secrets.all_secrets
}
