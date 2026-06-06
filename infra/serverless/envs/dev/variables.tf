variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "user_profiles_table_name" {
  description = "DynamoDB table name for user profiles"
  type        = string
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID"
  type        = string
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS budget limit in USD"
  type        = string
}

variable "budget_notification_email" {
  description = "Email address for AWS Budget notifications"
  type        = string
  sensitive   = true
}

variable "grafana_aws_account_id" {
  description = "Grafana Cloud AWS account ID for AssumeRole"
  type        = string
}

variable "grafana_external_id" {
  description = "Grafana Cloud external ID for AssumeRole"
  type        = string
  sensitive   = true
}

variable "lambda_kms_key_arn" {
  description = "KMS key ARN used to encrypt Lambda environment variables"
  type        = string
}