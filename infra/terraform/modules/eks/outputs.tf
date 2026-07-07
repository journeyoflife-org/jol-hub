# -----------------------------------------------------------------------------
# JOL-HUB EKS Module Outputs
# -----------------------------------------------------------------------------

output "cluster_id" {
  description = "ID of the EKS cluster"
  value       = aws_eks_cluster.jol_hub.id
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.jol_hub.name
}

output "cluster_endpoint" {
  description = "Endpoint for the EKS cluster API"
  value       = aws_eks_cluster.jol_hub.endpoint
}

output "cluster_version" {
  description = "Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.jol_hub.version
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for cluster authentication"
  value       = aws_eks_cluster.jol_hub.certificate_authority[0].data
}

output "cluster_oidc_issuer_url" {
  description = "OIDC issuer URL for the cluster"
  value       = aws_eks_cluster.jol_hub.identity[0].oidc[0].issuer
}

output "cluster_oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_role_arn" {
  description = "ARN of the EKS node IAM role"
  value       = aws_iam_role.eks_node_group.arn
}

output "general_node_group_arn" {
  description = "ARN of the general node group"
  value       = aws_eks_node_group.general.arn
}

output "compute_node_group_arn" {
  description = "ARN of the compute node group"
  value       = aws_eks_node_group.compute.arn
}

output "kubectl_config" {
  description = "kubectl configuration for the cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.jol_hub.name} --region ${data.aws_region.current.name}"
}
