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

resource "aws_ssm_parameter" "bedrock_model_id" {
  name        = "/${var.project_name}/${var.environment}/bedrock/model-id"
  description = "Bedrock model ID for KoreanMate ${var.environment}"
  type        = "String"
  value       = var.bedrock_model_id

  tags = local.common_tags
}

module "lambda" {
  source = "../../modules/lambda"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  correction_zip_path   = "../../../../apps/backend/lambda-packages/correction.zip"
  conversation_zip_path = "../../../../apps/backend/lambda-packages/conversation.zip"
  level_test_zip_path   = "../../../../apps/backend/lambda-packages/levelTest.zip"

  learning_records_table_name = module.dynamodb.learning_records_table_name
  usage_limits_table_name     = module.dynamodb.usage_limits_table_name
  user_profiles_table_name    = module.dynamodb.user_profiles_table_name

  learning_records_table_arn = module.dynamodb.learning_records_table_arn
  usage_limits_table_arn     = module.dynamodb.usage_limits_table_arn
  user_profiles_table_arn    = module.dynamodb.user_profiles_table_arn

  bedrock_model_id = aws_ssm_parameter.bedrock_model_id.value

  tags = local.common_tags
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment

  correction_lambda_invoke_arn   = module.lambda.correction_invoke_arn
  conversation_lambda_invoke_arn = module.lambda.conversation_invoke_arn
  level_test_lambda_invoke_arn   = module.lambda.level_test_invoke_arn

  correction_lambda_function_name   = module.lambda.correction_function_name
  conversation_lambda_function_name = module.lambda.conversation_function_name
  level_test_lambda_function_name   = module.lambda.level_test_function_name

  cognito_issuer_url    = module.cognito.issuer_url
  cognito_app_client_id = module.cognito.user_pool_client_id

  cors_allowed_origins = [
    "http://localhost:5173",
    "https://${module.s3_cloudfront.cloudfront_domain_name}"
  ]

  tags = local.common_tags
}

module "s3_cloudfront" {
  source = "../../modules/s3-cloudfront"

  project_name = var.project_name
  environment  = var.environment

  tags = local.common_tags
}

module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  tags = local.common_tags
}