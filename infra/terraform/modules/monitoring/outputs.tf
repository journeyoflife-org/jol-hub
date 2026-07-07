# -----------------------------------------------------------------------------
# JOL-HUB Monitoring Module Outputs
# -----------------------------------------------------------------------------

output "prometheus_workspace_id" {
  description = "ID of the Prometheus workspace"
  value       = aws_prometheus_workspace.jol_hub.id
}

output "prometheus_workspace_arn" {
  description = "ARN of the Prometheus workspace"
  value       = aws_prometheus_workspace.jol_hub.arn
}

output "prometheus_endpoint" {
  description = "Endpoint for the Prometheus workspace"
  value       = aws_prometheus_workspace.jol_hub.prometheus_endpoint
}

output "grafana_workspace_id" {
  description = "ID of the Grafana workspace"
  value       = aws_grafana_workspace.jol_hub.id
}

output "grafana_endpoint" {
  description = "Endpoint for the Grafana workspace"
  value       = aws_grafana_workspace.jol_hub.endpoint
}

output "grafana_workspace_arn" {
  description = "ARN of the Grafana workspace"
  value       = aws_grafana_workspace.jol_hub.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.jol_hub.dashboard_name
}
