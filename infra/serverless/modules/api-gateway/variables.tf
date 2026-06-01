variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "correction_lambda_invoke_arn" {
  description = "Invoke ARN for correction Lambda"
  type        = string
}

variable "conversation_lambda_invoke_arn" {
  description = "Invoke ARN for conversation Lambda"
  type        = string
}

variable "level_test_lambda_invoke_arn" {
  description = "Invoke ARN for level test Lambda"
  type        = string
}

variable "correction_lambda_function_name" {
  description = "Correction Lambda function name"
  type        = string
}

variable "conversation_lambda_function_name" {
  description = "Conversation Lambda function name"
  type        = string
}

variable "level_test_lambda_function_name" {
  description = "Level test Lambda function name"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

variable "cognito_issuer_url" {
  description = "Cognito User Pool issuer URL for JWT authorizer"
  type        = string
}

variable "cognito_app_client_id" {
  description = "Cognito User Pool App Client ID for JWT authorizer audience"
  type        = string
}
