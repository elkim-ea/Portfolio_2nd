# KoreanMate Portfolio Overview

KoreanMate는 두 가지 인프라 버전으로 구성된다.

## 1. Serverless Version

Serverless 버전은 AWS 관리형 서비스를 중심으로 비용 최적화, 인증/인가, AI 사용량 제한, 관측성, CI/CD 자동화를 보여주는 버전이다.

주요 구성:

- S3 + CloudFront
- API Gateway + Lambda
- Cognito
- DynamoDB
- Bedrock
- CloudWatch / CloudTrail / Grafana
- GitHub OIDC
- SNS Email Notification

문서 위치:

- `docs/serverless/project-plan.md`
- `docs/serverless/serverless-design.md`
- `docs/serverless/runbook.md`
- `docs/serverless/troubleshooting.md`

## 2. EKS Version

EKS 버전은 Serverless 버전의 대체가 아니라 Kubernetes 운영 역량을 보여주기 위한 별도 확장 버전이다.

주요 구성:

- Amazon EKS
- Docker
- Helm 또는 Kustomize
- Argo CD
- AWS Load Balancer Controller
- Prometheus / Grafana / Loki
- Falco
- External Secrets
- IRSA
- Amazon ECR

문서 위치:

- `docs/eks/eks-project-plan.md`
- `docs/eks/eks-design.md`
- `docs/eks/eks-security-design.md`
- `docs/eks/eks-observability.md`