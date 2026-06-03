output "correction_function_name" {
  value = aws_lambda_function.functions["correction"].function_name
}

output "conversation_function_name" {
  value = aws_lambda_function.functions["conversation"].function_name
}

output "level_test_function_name" {
  value = aws_lambda_function.functions["level_test"].function_name
}

output "correction_function_arn" {
  value = aws_lambda_function.functions["correction"].arn
}

output "conversation_function_arn" {
  value = aws_lambda_function.functions["conversation"].arn
}

output "level_test_function_arn" {
  value = aws_lambda_function.functions["level_test"].arn
}

output "correction_invoke_arn" {
  value = aws_lambda_function.functions["correction"].invoke_arn
}

output "conversation_invoke_arn" {
  value = aws_lambda_function.functions["conversation"].invoke_arn
}

output "level_test_invoke_arn" {
  value = aws_lambda_function.functions["level_test"].invoke_arn
}

output "lambda_function_names" {
  value = [
    aws_lambda_function.functions["correction"].function_name,
    aws_lambda_function.functions["conversation"].function_name,
    aws_lambda_function.functions["level_test"].function_name
  ]
}