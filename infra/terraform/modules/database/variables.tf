variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jol-hub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "database_subnet_ids" {
  description = "List of database subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "ID of the RDS security group"
  type        = string
}

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

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
