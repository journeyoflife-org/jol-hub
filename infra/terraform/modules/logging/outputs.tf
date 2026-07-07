# -----------------------------------------------------------------------------
# JOL-HUB Logging Module Outputs
# -----------------------------------------------------------------------------

output "opensearch_domain_arn" {
  description = "ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.jol_hub.arn
}

output "opensearch_domain_id" {
  description = "ID of the OpenSearch domain"
  value       = aws_opensearch_domain.jol_hub.domain_id
}

output "opensearch_endpoint" {
  description = "Endpoint for the OpenSearch domain"
  value       = aws_opensearch_domain.jol_hub.endpoint
}

output "opensearch_kibana_endpoint" {
  description = "Kibana endpoint for the OpenSearch domain"
  value       = aws_opensearch_domain.jol_hub.kibana_endpoint
}

output "opensearch_dashboard_endpoint" {
  description = "Dashboard endpoint for the OpenSearch domain"
  value       = aws_opensearch_domain.jol_hub.dashboard_endpoint
}

output "fluent_bit_role_arn" {
  description = "ARN of the Fluent Bit IAM role"
  value       = aws_iam_role.fluent_bit.arn
}

output "security_group_id" {
  description = "Security group ID for OpenSearch"
  value       = aws_security_group.opensearch.id
}
