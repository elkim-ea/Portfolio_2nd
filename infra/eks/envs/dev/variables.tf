variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "EKS VPC CIDR block"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "EKS public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "EKS private subnet CIDR blocks"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones for EKS VPC"
  type        = list(string)
}

variable "cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
}

variable "node_instance_types" {
  description = "EKS node instance types"
  type        = list(string)
}

variable "node_desired_size" {
  description = "EKS desired node count"
  type        = number
}

variable "node_min_size" {
  description = "EKS minimum node count"
  type        = number
}

variable "node_max_size" {
  description = "EKS maximum node count"
  type        = number
}