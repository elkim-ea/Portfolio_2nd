variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_function_names" {
  description = "Lambda function names to monitor"
  type        = list(string)
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}