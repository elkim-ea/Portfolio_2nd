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

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "lambda_environment" {
  description         = "KMS key for ${var.project_name} ${var.environment} Lambda environment variables"
  enable_key_rotation = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableAccountRootPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_environment_kms" {
  name = "${var.project_name}-${var.environment}-lambda-environment-kms"
  role = module.iam.lambda_execution_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaEnvironmentKMSUse"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = aws_kms_key.lambda_environment.arn
        Condition = {
          StringEquals = {
            "kms:ViaService"    = "lambda.${var.aws_region}.amazonaws.com"
            "kms:CallerAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "lambda_environment" {
  name          = "alias/${var.project_name}-${var.environment}-lambda-env"
  target_key_id = aws_kms_key.lambda_environment.key_id
}

module "lambda" {
  source = "../../modules/lambda"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  lambda_execution_role_arn = module.iam.lambda_execution_role_arn

  lambda_environment_kms_key_arn = aws_kms_key.lambda_environment.arn

  correction_zip_path   = "../../../../apps/backend/lambda-packages/correction.zip"
  conversation_zip_path = "../../../../apps/backend/lambda-packages/conversation.zip"
  level_test_zip_path   = "../../../../apps/backend/lambda-packages/levelTest.zip"
  profile_zip_path      = "../../../../apps/backend/lambda-packages/profile.zip"
  history_zip_path      = "../../../../apps/backend/lambda-packages/history.zip"
  usage_zip_path        = "../../../../apps/backend/lambda-packages/usage.zip"

  learning_records_table_name = module.dynamodb.learning_records_table_name
  usage_limits_table_name     = module.dynamodb.usage_limits_table_name
  user_profiles_table_name    = module.dynamodb.user_profiles_table_name

  learning_records_table_arn = module.dynamodb.learning_records_table_arn
  usage_limits_table_arn     = module.dynamodb.usage_limits_table_arn
  user_profiles_table_arn    = module.dynamodb.user_profiles_table_arn

  bedrock_model_id = aws_ssm_parameter.bedrock_model_id.value

  tags = local.common_tags

  depends_on = [
    module.iam,
    aws_iam_role_policy.lambda_environment_kms
  ]
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment

  correction_lambda_invoke_arn   = module.lambda.correction_invoke_arn
  conversation_lambda_invoke_arn = module.lambda.conversation_invoke_arn
  level_test_lambda_invoke_arn   = module.lambda.level_test_invoke_arn
  profile_lambda_invoke_arn      = module.lambda.profile_invoke_arn
  history_lambda_invoke_arn      = module.lambda.history_invoke_arn
  usage_lambda_invoke_arn        = module.lambda.usage_invoke_arn

  correction_lambda_function_name   = module.lambda.correction_function_name
  conversation_lambda_function_name = module.lambda.conversation_function_name
  level_test_lambda_function_name   = module.lambda.level_test_function_name
  profile_lambda_function_name      = module.lambda.profile_function_name
  history_lambda_function_name      = module.lambda.history_function_name
  usage_lambda_function_name        = module.lambda.usage_function_name

  cognito_issuer_url    = module.cognito.issuer_url
  cognito_app_client_id = module.cognito.user_pool_client_id

  cors_allowed_origins = [
    "http://localhost:5173",
    "https://${module.s3_cloudfront.cloudfront_domain_name}"
  ]

  tags = local.common_tags
}

resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws.us_east_1

  name        = "${var.project_name}-${var.environment}-cloudfront-waf"
  description = "WAF for ${var.project_name} ${var.environment} CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-cf-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitPerIp"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-cf-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-cloudfront-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

module "s3_cloudfront" {
  source = "../../modules/s3-cloudfront"

  project_name = var.project_name
  environment  = var.environment
  web_acl_id   = aws_wafv2_web_acl.cloudfront.arn

  tags = local.common_tags
}

module "monitoring" {
  source = "../../modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  lambda_function_names = module.lambda.lambda_function_names
  api_gateway_id        = module.api_gateway.api_id

  tags = local.common_tags
}

module "grafana_cloud" {
  source = "../../modules/grafana-cloud"

  project_name = var.project_name
  environment  = var.environment

  grafana_aws_account_id = var.grafana_aws_account_id
  grafana_external_id    = var.grafana_external_id

  tags = local.common_tags
}

module "cloudtrail" {
  source = "../../modules/cloudtrail"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  tags = local.common_tags
}

module "budget" {
  source = "../../modules/budget"

  project_name = var.project_name
  environment  = var.environment

  monthly_budget_limit_usd  = var.monthly_budget_limit_usd
  budget_notification_email = var.budget_notification_email
}

module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  tags = local.common_tags
}

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment

  learning_records_table_arn = module.dynamodb.learning_records_table_arn
  usage_limits_table_arn     = module.dynamodb.usage_limits_table_arn
  user_profiles_table_arn    = module.dynamodb.user_profiles_table_arn

  tags = local.common_tags
}