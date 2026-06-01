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