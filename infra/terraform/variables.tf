# -----------------------------------------------------------------------------
# Global Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jol-hub"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

# -----------------------------------------------------------------------------
# VPC Variables
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3
}

# -----------------------------------------------------------------------------
# Security Variables
# -----------------------------------------------------------------------------

variable "enable_bastion" {
  description = "Whether to create a bastion security group"
  type        = bool
  default     = false
}

variable "allowed_admin_cidrs" {
  description = "List of CIDR blocks allowed to access bastion"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Database Variables
# -----------------------------------------------------------------------------

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "jolhub"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "jolhub_admin"
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16.3"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "rds_backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "rds_enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# ElastiCache Variables
# -----------------------------------------------------------------------------

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "7.1"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters (nodes) in the replication group"
  type        = number
  default     = 2
}

variable "redis_snapshot_retention_days" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

# -----------------------------------------------------------------------------
# Storage Variables
# -----------------------------------------------------------------------------

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# ECS Variables
# -----------------------------------------------------------------------------

variable "alb_certificate_arn" {
  description = "ARN of ACM certificate for ALB HTTPS"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

# Django Service
variable "django_cpu" {
  description = "CPU units for Django tasks"
  type        = string
  default     = "512"
}

variable "django_memory" {
  description = "Memory for Django tasks (MiB)"
  type        = string
  default     = "1024"
}

variable "django_desired_count" {
  description = "Desired number of Django tasks"
  type        = number
  default     = 2
}

variable "django_min_count" {
  description = "Minimum number of Django tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "django_max_count" {
  description = "Maximum number of Django tasks for auto-scaling"
  type        = number
  default     = 10
}

# Celery Service
variable "celery_cpu" {
  description = "CPU units for Celery tasks"
  type        = string
  default     = "256"
}

variable "celery_memory" {
  description = "Memory for Celery tasks (MiB)"
  type        = string
  default     = "512"
}

variable "celery_worker_desired_count" {
  description = "Desired number of Celery worker tasks"
  type        = number
  default     = 2
}

variable "celery_worker_min_count" {
  description = "Minimum number of Celery worker tasks"
  type        = number
  default     = 1
}

variable "celery_worker_max_count" {
  description = "Maximum number of Celery worker tasks"
  type        = number
  default     = 10
}

# -----------------------------------------------------------------------------
# DNS Variables
# -----------------------------------------------------------------------------

variable "route53_zone_id" {
  description = "Route53 hosted zone ID (optional)"
  type        = string
  default     = ""
}

variable "app_domain" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Monitoring Variables
# -----------------------------------------------------------------------------

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
  default     = ""
}

variable "enable_monitoring" {
  description = "Enable AWS Managed Prometheus and Grafana"
  type        = bool
  default     = false
}

variable "api_latency_threshold" {
  description = "API latency threshold in seconds"
  type        = number
  default     = 1.0
}

variable "error_rate_threshold" {
  description = "Error rate threshold percentage"
  type        = number
  default     = 5.0
}

variable "db_cpu_threshold" {
  description = "Database CPU threshold percentage"
  type        = number
  default     = 80
}

variable "redis_memory_threshold" {
  description = "Redis memory threshold in bytes"
  type        = number
  default     = 536870912  # 512MB
}

variable "rds_max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 100
}

# -----------------------------------------------------------------------------
# EKS Variables
# -----------------------------------------------------------------------------

variable "enable_eks" {
  description = "Enable EKS Kubernetes cluster"
  type        = bool
  default     = false
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "eks_general_instance_types" {
  description = "Instance types for general node group"
  type        = list(string)
  default     = ["m6i.xlarge", "m6a.xlarge"]
}

variable "eks_general_desired_size" {
  description = "Desired number of nodes in general node group"
  type        = number
  default     = 3
}

variable "eks_general_min_size" {
  description = "Minimum number of nodes in general node group"
  type        = number
  default     = 2
}

variable "eks_general_max_size" {
  description = "Maximum number of nodes in general node group"
  type        = number
  default     = 10
}

variable "eks_compute_instance_types" {
  description = "Instance types for compute node group"
  type        = list(string)
  default     = ["c6i.xlarge", "c6a.xlarge"]
}

variable "eks_compute_desired_size" {
  description = "Desired number of nodes in compute node group"
  type        = number
  default     = 2
}

variable "eks_compute_min_size" {
  description = "Minimum number of nodes in compute node group"
  type        = number
  default     = 1
}

variable "eks_compute_max_size" {
  description = "Maximum number of nodes in compute node group"
  type        = number
  default     = 10
}

# -----------------------------------------------------------------------------
# Logging Variables
# -----------------------------------------------------------------------------

variable "enable_logging" {
  description = "Enable OpenSearch logging stack"
  type        = bool
  default     = false
}

variable "opensearch_master_password" {
  description = "OpenSearch master user password"
  type        = string
  sensitive   = true
  default     = ""
}

# -----------------------------------------------------------------------------
# Secrets Management Variables
# -----------------------------------------------------------------------------

variable "secrets_recovery_window_days" {
  description = "Number of days to retain deleted secrets (7-30)"
  type        = number
  default     = 7
}

variable "enable_secret_rotation" {
  description = "Enable automatic secret rotation"
  type        = bool
  default     = false
}

# Payment Secrets (PCI-DSS Scoped)
# Model A (ADR-0005, STEP 18): card-processor (PSP) secret variables were
# purged — hub never holds PSP credentials; the marketplace payment
# boundary does. PayPal/email variables remain below.

variable "paypal_client_id" {
  description = "PayPal client ID"
  type        = string
  default     = ""
}

variable "paypal_client_secret" {
  description = "PayPal client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "paypal_mode" {
  description = "PayPal mode (sandbox or live)"
  type        = string
  default     = "sandbox"
}

# Email Secrets
variable "email_host" {
  description = "SMTP server hostname"
  type        = string
  default     = "smtp.gmail.com"
}

variable "email_port" {
  description = "SMTP server port"
  type        = number
  default     = 587
}

variable "email_host_user" {
  description = "SMTP username"
  type        = string
  default     = ""
}

variable "email_host_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "email_use_tls" {
  description = "Use TLS for SMTP connection"
  type        = bool
  default     = true
}

# Integration Secrets
variable "bitrix24_webhook_url" {
  description = "Bitrix24 incoming webhook URL"
  type        = string
  sensitive   = true
  default     = ""
}

variable "bitrix24_portal_id" {
  description = "Bitrix24 portal ID"
  type        = string
  default     = ""
}

variable "bitrix24_contact_group_id" {
  description = "Bitrix24 contact group ID"
  type        = string
  default     = ""
}

# OAuth Secrets
variable "google_oauth_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "facebook_oauth_client_id" {
  description = "Facebook OAuth client ID"
  type        = string
  default     = ""
}

variable "facebook_oauth_client_secret" {
  description = "Facebook OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# HashiCorp Vault
variable "enable_vault" {
  description = "Enable HashiCorp Vault integration"
  type        = bool
  default     = false
}

variable "vault_addr" {
  description = "HashiCorp Vault server address"
  type        = string
  default     = ""
}

variable "vault_namespace" {
  description = "HashiCorp Vault namespace (for Enterprise)"
  type        = string
  default     = ""
}
