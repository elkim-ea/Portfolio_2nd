variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "correction_zip_path" {
  description = "Path to correction Lambda zip"
  type        = string
}

variable "conversation_zip_path" {
  description = "Path to conversation Lambda zip"
  type        = string
}

variable "level_test_zip_path" {
  description = "Path to level test Lambda zip"
  type        = string
}

variable "learning_records_table_name" {
  description = "Learning records table name"
  type        = string
}

variable "usage_limits_table_name" {
  description = "Usage limits table name"
  type        = string
}

variable "user_profiles_table_name" {
  description = "User profiles table name"
  type        = string
}

variable "learning_records_table_arn" {
  description = "Learning records table ARN"
  type        = string
}

variable "usage_limits_table_arn" {
  description = "Usage limits table ARN"
  type        = string
}

variable "user_profiles_table_arn" {
  description = "User profiles table ARN"
  type        = string
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

variable "lambda_execution_role_arn" {
  description = "Lambda execution role ARN"
  type        = string
}

variable "lambda_environment_kms_key_arn" {
  description = "KMS key ARN for Lambda environment variable encryption"
  type        = string
}

variable "profile_zip_path" {
  description = "Path to profile Lambda zip"
  type        = string
}

variable "history_zip_path" {
  description = "Path to history Lambda zip"
  type        = string
}

variable "usage_zip_path" {
  description = "Path to usage Lambda zip"
  type        = string
}