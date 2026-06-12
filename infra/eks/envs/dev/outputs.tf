output "backend_ecr_repository_name" {
  description = "Backend ECR repository name"
  value       = module.backend_ecr.repository_name
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = module.backend_ecr.repository_url
}

output "backend_ecr_repository_arn" {
  description = "Backend ECR repository ARN"
  value       = module.backend_ecr.repository_arn
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_node_group_name" {
  description = "EKS node group name"
  value       = module.eks.node_group_name
}

output "eks_vpc_id" {
  description = "EKS VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_oidc_issuer_url" {
  description = "EKS cluster OIDC issuer URL"
  value       = module.eks.cluster_oidc_issuer_url
}