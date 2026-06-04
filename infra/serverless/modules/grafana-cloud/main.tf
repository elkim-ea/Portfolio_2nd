resource "aws_iam_role" "grafana_cloudwatch_readonly" {
  name = "${var.project_name}-${var.environment}-grafana-cloudwatch-readonly-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowGrafanaCloudAssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.grafana_aws_account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.grafana_external_id
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "grafana_cloudwatch_readonly" {
  name = "${var.project_name}-${var.environment}-grafana-cloudwatch-readonly-policy"
  role = aws_iam_role.grafana_cloudwatch_readonly.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchMetricsRead"
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowTagReadForResourceDiscovery"
        Effect = "Allow"
        Action = [
          "tag:GetResources"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogsRead"
        Effect = "Allow"
        Action = [
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams",
            "logs:FilterLogEvents",
            "logs:StartQuery",
            "logs:StopQuery",
            "logs:GetQueryResults",
            "logs:GetLogEvents"
        ]
        Resource = "*"
        }
    ]
  })
}