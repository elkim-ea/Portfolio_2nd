output "learning_records_table_name" {
  value = aws_dynamodb_table.learning_records.name
}

output "usage_limits_table_name" {
  value = aws_dynamodb_table.usage_limits.name
}