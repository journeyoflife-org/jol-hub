variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jol-hub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "ecs_security_group_id" {
  description = "ID of the ECS security group"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the database credentials secret"
  type        = string
}

variable "redis_secret_arn" {
  description = "ARN of the Redis credentials secret"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for static/media files"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

# Django Service Configuration
variable "django_cpu" {
  description = "CPU units for Django tasks (256 = 0.25 vCPU)"
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

# Celery Configuration
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
