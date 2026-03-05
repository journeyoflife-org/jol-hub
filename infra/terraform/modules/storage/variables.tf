variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jol-hub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_100, PriceClass_200, PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
