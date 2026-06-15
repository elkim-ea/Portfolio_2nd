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

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

variable "callback_urls" {
  description = "Allowed callback URLs for Cognito app client"
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed logout URLs for Cognito app client"
  type        = list(string)
}