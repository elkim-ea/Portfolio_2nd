output "learning_records_table_name" {
  value = aws_dynamodb_table.learning_records.name
}

output "usage_limits_table_name" {
  value = aws_dynamodb_table.usage_limits.name
}

output "user_profiles_table_name" {
  value = aws_dynamodb_table.user_profiles.name
}

output "learning_records_table_arn" {
  value = aws_dynamodb_table.learning_records.arn
}

output "usage_limits_table_arn" {
  value = aws_dynamodb_table.usage_limits.arn
}

output "user_profiles_table_arn" {
  value = aws_dynamodb_table.user_profiles.arn
}