variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS budget limit in USD"
  type        = string
}

variable "budget_notification_email" {
  description = "Email address for AWS Budget notifications"
  type        = string
}