locals {
  backend_repository_name = "${var.project_name}-${var.environment}-backend"
}

module "backend_ecr" {
  source = "../../modules/ecr"

  project_name    = var.project_name
  environment     = var.environment
  repository_name = local.backend_repository_name
}