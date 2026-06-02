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