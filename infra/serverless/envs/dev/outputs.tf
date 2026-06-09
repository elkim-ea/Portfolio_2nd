output "learning_records_table_name" {
  value = module.dynamodb.learning_records_table_name
}

output "usage_limits_table_name" {
  value = module.dynamodb.usage_limits_table_name
}

output "user_profiles_table_name" {
  value = module.dynamodb.user_profiles_table_name
}

output "learning_records_table_arn" {
  value = module.dynamodb.learning_records_table_arn
}

output "usage_limits_table_arn" {
  value = module.dynamodb.usage_limits_table_arn
}

output "user_profiles_table_arn" {
  value = module.dynamodb.user_profiles_table_arn
}

output "api_gateway_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "api_gateway_id" {
  value = module.api_gateway.api_id
}

output "frontend_bucket_name" {
  value = module.s3_cloudfront.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  value = module.s3_cloudfront.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  value = module.s3_cloudfront.cloudfront_domain_name
}

output "cloudfront_url" {
  value = module.s3_cloudfront.cloudfront_url
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "cognito_issuer_url" {
  value = module.cognito.issuer_url
}

output "bedrock_model_id_parameter_name" {
  value = aws_ssm_parameter.bedrock_model_id.name
}

output "cloudfront_waf_web_acl_arn" {
  value = aws_wafv2_web_acl.cloudfront.arn
}

output "cloudfront_waf_web_acl_name" {
  value = aws_wafv2_web_acl.cloudfront.name
}

output "lambda_error_alarm_names" {
  value = module.monitoring.lambda_error_alarm_names
}

output "lambda_duration_alarm_names" {
  value = module.monitoring.lambda_duration_alarm_names
}

output "api_gateway_5xx_alarm_name" {
  value = module.monitoring.api_gateway_5xx_alarm_name
}

output "cloudtrail_name" {
  value = module.cloudtrail.cloudtrail_name
}

output "cloudtrail_arn" {
  value = module.cloudtrail.cloudtrail_arn
}

output "cloudtrail_bucket_name" {
  value = module.cloudtrail.cloudtrail_bucket_name
}

output "budget_name" {
  value = module.budget.budget_name
}

output "budget_limit_usd" {
  value = module.budget.budget_limit_usd
}

output "grafana_cloudwatch_role_arn" {
  value = module.grafana_cloud.grafana_cloudwatch_role_arn
}

output "grafana_cloudwatch_role_name" {
  value = module.grafana_cloud.grafana_cloudwatch_role_name
}

output "lambda_execution_role_arn" {
  value = module.iam.lambda_execution_role_arn
}

output "lambda_execution_role_name" {
  value = module.iam.lambda_execution_role_name
}

output "lambda_function_names" {
  value = module.lambda.lambda_function_names
}

output "lambda_function_arns" {
  value = module.lambda.lambda_function_arns
}

output "github_actions_deploy_role_arn" {
  value = module.github_oidc.github_actions_deploy_role_arn
}