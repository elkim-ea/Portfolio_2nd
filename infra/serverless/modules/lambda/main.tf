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

resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-${var.environment}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowDynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.learning_records_table_arn,
          var.usage_limits_table_arn,
          var.user_profiles_table_arn
        ]
      },
      {
        Sid    = "AllowBedrockInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:Converse"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  function_name    = each.value.function_name
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = each.value.handler
  runtime          = "nodejs20.x"
  filename         = each.value.zip_path
  source_code_hash = filebase64sha256(each.value.zip_path)

  memory_size = 512
  timeout     = 30

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

  tags = var.tags
}
