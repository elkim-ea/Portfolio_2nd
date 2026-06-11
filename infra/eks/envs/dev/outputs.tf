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