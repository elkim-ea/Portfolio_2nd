locals {
  lambda_functions = {
    correction = {
      function_name = "${var.project_name}-${var.environment}-correction"
      handler       = "correction.handler"
      zip_path      = var.correction_zip_path
    }

    conversation = {
      function_name = "${var.project_name}-${var.environment}-conversation"
      handler       = "conversation.handler"
      zip_path      = var.conversation_zip_path
    }

    level_test = {
      function_name = "${var.project_name}-${var.environment}-level-test"
      handler       = "levelTest.handler"
      zip_path      = var.level_test_zip_path
    }
  }
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  function_name    = each.value.function_name
  role             = var.lambda_execution_role_arn
  handler          = each.value.handler
  runtime          = "nodejs20.x"
  filename         = each.value.zip_path
  source_code_hash = filebase64sha256(each.value.zip_path)

  memory_size = 512
  timeout     = 30

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      NODE_ENV                    = "production"
      LOG_LEVEL                   = "info"
      BEDROCK_MODEL_ID            = var.bedrock_model_id
      LEARNING_RECORDS_TABLE_NAME = var.learning_records_table_name
      USAGE_LIMITS_TABLE_NAME     = var.usage_limits_table_name
      USER_PROFILES_TABLE_NAME    = var.user_profiles_table_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda
  ]
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${each.value.function_name}"
  retention_in_days = 14

  tags = var.tags
}