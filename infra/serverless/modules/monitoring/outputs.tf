output "lambda_error_alarm_names" {
  value = [
    for alarm in aws_cloudwatch_metric_alarm.lambda_errors : alarm.alarm_name
  ]
}

output "lambda_duration_alarm_names" {
  value = [
    for alarm in aws_cloudwatch_metric_alarm.lambda_duration : alarm.alarm_name
  ]
}

output "api_gateway_5xx_alarm_name" {
  value = aws_cloudwatch_metric_alarm.api_gateway_5xx.alarm_name
}