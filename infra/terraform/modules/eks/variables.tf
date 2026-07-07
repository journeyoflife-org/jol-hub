# -----------------------------------------------------------------------------
# JOL-HUB EKS Module Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Cluster Configuration
variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "subnet_ids" {
  description = "List of subnet IDs for the EKS cluster"
  type        = list(string)
}

variable "node_group_subnet_ids" {
  description = "List of subnet IDs for the node groups"
  type        = list(string)
}

variable "cluster_security_group_id" {
  description = "Security group ID for the EKS cluster"
  type        = string
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks for public API access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# S3 Access
variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for static/media files"
  type        = string
}

# General Node Group
variable "general_instance_types" {
  description = "Instance types for general node group"
  type        = list(string)
  default     = ["m6i.xlarge", "m6a.xlarge"]
}

variable "general_desired_size" {
  description = "Desired number of nodes in general node group"
  type        = number
  default     = 3
}

variable "general_min_size" {
  description = "Minimum number of nodes in general node group"
  type        = number
  default     = 2
}

variable "general_max_size" {
  description = "Maximum number of nodes in general node group"
  type        = number
  default     = 10
}

# Compute Node Group
variable "compute_instance_types" {
  description = "Instance types for compute node group"
  type        = list(string)
  default     = ["c6i.xlarge", "c6a.xlarge"]
}

variable "compute_desired_size" {
  description = "Desired number of nodes in compute node group"
  type        = number
  default     = 2
}

variable "compute_min_size" {
  description = "Minimum number of nodes in compute node group"
  type        = number
  default     = 1
}

variable "compute_max_size" {
  description = "Maximum number of nodes in compute node group"
  type        = number
  default     = 10
}

# Node Configuration
variable "node_disk_size" {
  description = "Disk size for worker nodes (GB)"
  type        = number
  default     = 100
}

# EKS Add-on Versions
variable "vpc_cni_version" {
  description = "VPC CNI add-on version"
  type        = string
  default     = "v1.14.0-eksbuild.1"
}

variable "coredns_version" {
  description = "CoreDNS add-on version"
  type        = string
  default     = "v1.10.1-eksbuild.2"
}

variable "kube_proxy_version" {
  description = "Kube-proxy add-on version"
  type        = string
  default     = "v1.28.1-eksbuild.1"
}

variable "ebs_csi_version" {
  description = "EBS CSI driver add-on version"
  type        = string
  default     = "v1.24.0-eksbuild.1"
}
