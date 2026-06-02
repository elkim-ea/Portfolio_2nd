variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_stage_arn" {
  description = "API Gateway stage ARN to associate with WAF"
  type        = string
}

variable "rate_limit" {
  description = "Maximum requests per 5 minutes per IP"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}