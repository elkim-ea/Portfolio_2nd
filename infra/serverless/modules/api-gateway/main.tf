locals {
  routes = {
    correction = {
      route_key            = "POST /correction"
      lambda_invoke_arn    = var.correction_lambda_invoke_arn
      lambda_function_name = var.correction_lambda_function_name
    }

    conversation = {
      route_key            = "POST /conversation"
      lambda_invoke_arn    = var.conversation_lambda_invoke_arn
      lambda_function_name = var.conversation_lambda_function_name
    }

    level_test = {
      route_key            = "POST /level-test"
      lambda_invoke_arn    = var.level_test_lambda_invoke_arn
      lambda_function_name = var.level_test_lambda_function_name
    }
  }
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-${var.environment}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = [
      "OPTIONS",
      "POST"
    ]
    allow_headers = [
      "content-type",
      "authorization"
    ]
    max_age = 300
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each = local.routes

  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.lambda_invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
}

resource "aws_lambda_permission" "allow_api_gateway" {
  for_each = local.routes

  statement_id  = "AllowExecutionFromAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}