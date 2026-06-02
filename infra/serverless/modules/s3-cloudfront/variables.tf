variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

variable "web_acl_id" {
  description = "AWS WAFv2 Web ACL ARN for CloudFront distribution"
  type        = string
  default     = null
}