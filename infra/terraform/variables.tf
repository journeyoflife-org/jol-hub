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
