output "grafana_cloudwatch_role_arn" {
  value = aws_iam_role.grafana_cloudwatch_readonly.arn
}

output "grafana_cloudwatch_role_name" {
  value = aws_iam_role.grafana_cloudwatch_readonly.name
}