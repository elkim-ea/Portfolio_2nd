variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
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

variable "tags" {
  description = "Common tags"
  type        = map(string)
}