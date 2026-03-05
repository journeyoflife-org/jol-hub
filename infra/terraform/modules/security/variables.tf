variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jol-hub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}

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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
