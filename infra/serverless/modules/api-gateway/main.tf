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

    profile_get = {
      route_key            = "GET /profile"
      lambda_invoke_arn    = var.profile_lambda_invoke_arn
      lambda_function_name = var.profile_lambda_function_name
    }

    profile_put = {
      route_key            = "PUT /profile"
      lambda_invoke_arn    = var.profile_lambda_invoke_arn
      lambda_function_name = var.profile_lambda_function_name
    }

    history = {
      route_key            = "GET /history"
      lambda_invoke_arn    = var.history_lambda_invoke_arn
      lambda_function_name = var.history_lambda_function_name
    }

    usage = {
      route_key            = "GET /usage"
      lambda_invoke_arn    = var.usage_lambda_invoke_arn
      lambda_function_name = var.usage_lambda_function_name
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
      "GET",
      "POST",
      "PUT"
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

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access_logs.arn

    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationErr = "$context.integrationErrorMessage"
      authorizerErr  = "$context.authorizer.error"
    })
  }

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

  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_jwt.id
}

resource "aws_lambda_permission" "allow_api_gateway" {
  for_each = local.routes

  statement_id  = "AllowExecutionFromAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_authorizer" "cognito_jwt" {
  api_id           = aws_apigatewayv2_api.http_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-${var.environment}-cognito-jwt-authorizer"

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = var.cognito_issuer_url
  }
}
resource "aws_cloudwatch_log_group" "api_access_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-http-api"
  retention_in_days = 14

  tags = var.tags
}
