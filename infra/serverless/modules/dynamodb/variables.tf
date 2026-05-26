variable "learning_records_table_name" {
  description = "DynamoDB table name for learning records"
  type        = string
}

variable "usage_limits_table_name" {
  description = "DynamoDB table name for usage limits"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}