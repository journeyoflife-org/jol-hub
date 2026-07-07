# -----------------------------------------------------------------------------
# JOL-HUB Monitoring Module Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# VPC Configuration
variable "vpc_id" {
  description = "VPC ID for Grafana workspace"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for Grafana"
  type        = list(string)
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Alerting
variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
}

# Application Load Balancer
variable "alb_name" {
  description = "Name of the Application Load Balancer"
  type        = string
}

# Database
variable "db_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "db_max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 100
}

# Redis
variable "redis_cluster_id" {
  description = "ElastiCache Redis cluster ID"
  type        = string
}

# Thresholds
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
