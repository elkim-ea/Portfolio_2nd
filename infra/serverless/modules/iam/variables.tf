variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "learning_records_table_arn" {
  description = "Learning records DynamoDB table ARN"
  type        = string
}

variable "usage_limits_table_arn" {
  description = "Usage limits DynamoDB table ARN"
  type        = string
}

variable "user_profiles_table_arn" {
  description = "User profiles DynamoDB table ARN"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
}
