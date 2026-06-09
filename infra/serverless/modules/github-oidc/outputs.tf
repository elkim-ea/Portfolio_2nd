output "github_actions_deploy_role_arn" {
  value = aws_iam_role.github_actions_deploy_role.arn
}

output "github_actions_deploy_role_name" {
  value = aws_iam_role.github_actions_deploy_role.name
}