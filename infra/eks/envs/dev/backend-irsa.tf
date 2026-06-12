data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "backend_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:koreanmate:backend"]
    }
  }
}

resource "aws_iam_policy" "backend_pod" {
  name        = "${local.cluster_name}-backend-pod-policy"
  description = "IAM policy for KoreanMate backend pod"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowDynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/koreanmate-dev-learning-records",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/koreanmate-dev-usage-limits",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/koreanmate-dev-user-profiles"
        ]
      },
      {
        Sid    = "AllowReadBedrockModelParameter"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/koreanmate/dev/bedrock/model-id"
        ]
      },
      {
        Sid    = "AllowBedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "BackendIRSA"
  }
}

resource "aws_iam_role" "backend_pod" {
  name = "${local.cluster_name}-backend-pod-role"

  assume_role_policy = data.aws_iam_policy_document.backend_assume_role.json

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "BackendIRSA"
  }
}

resource "aws_iam_role_policy_attachment" "backend_pod" {
  role       = aws_iam_role.backend_pod.name
  policy_arn = aws_iam_policy.backend_pod.arn
}

output "backend_pod_role_arn" {
  description = "Backend Pod IAM Role ARN for IRSA"
  value       = aws_iam_role.backend_pod.arn
}