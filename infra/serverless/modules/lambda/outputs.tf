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
    for function in aws_lambda_function.functions :
    function.function_name
  ]
}

output "lambda_function_arns" {
  description = "Lambda function ARNs"
  value = {
    for key, function in aws_lambda_function.functions :
    key => function.arn
  }
}

output "lambda_invoke_arns" {
  description = "Lambda invoke ARNs"
  value = {
    for key, function in aws_lambda_function.functions :
    key => function.invoke_arn
  }
}

output "profile_function_name" {
  value = aws_lambda_function.functions["profile"].function_name
}

output "history_function_name" {
  value = aws_lambda_function.functions["history"].function_name
}

output "usage_function_name" {
  value = aws_lambda_function.functions["usage"].function_name
}

output "profile_invoke_arn" {
  value = aws_lambda_function.functions["profile"].invoke_arn
}

output "history_invoke_arn" {
  value = aws_lambda_function.functions["history"].invoke_arn
}

output "usage_invoke_arn" {
  value = aws_lambda_function.functions["usage"].invoke_arn
}