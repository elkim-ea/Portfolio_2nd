locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  learning_records_table_name = "${var.project_name}-${var.environment}-learning-records"
  usage_limits_table_name     = "${var.project_name}-${var.environment}-usage-limits"
  user_profiles_table_name    = var.user_profiles_table_name

  tags = local.common_tags
}