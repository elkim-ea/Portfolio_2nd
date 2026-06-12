# KoreanMate

KoreanMate is an AI-powered Korean learning assistant built to demonstrate AWS cloud architecture, infrastructure as code, CI/CD automation, security, observability, and Kubernetes-based operations.

The project provides Korean writing correction, conversation generation, level testing, learning history, and daily AI usage tracking.

This portfolio is implemented in two infrastructure versions:

```text
KoreanMate
├── Serverless Version
│   └── Main cost-optimized cloud application
│
└── EKS Version
    └── Kubernetes operation validation environment
```

---

## 1. Project Overview

KoreanMate helps Korean language learners practice writing, conversation, and level assessment with AI support.

The main goal of this project is not only to build an AI web application, but also to demonstrate practical cloud engineering skills:

* AWS Serverless architecture design
* Terraform-based infrastructure as code
* Cognito-based authentication and user isolation
* AI API usage control for cost management
* CI/CD automation with GitHub Actions
* GitHub OIDC-based secure deployment
* CloudWatch, X-Ray, Grafana, and CloudTrail-based operations
* EKS-based Kubernetes deployment
* Argo CD GitOps workflow
* Trivy security scanning
* Prometheus/Grafana Kubernetes monitoring
* Runbook, troubleshooting, and evidence documentation

---

## 2. Main Features

| Feature                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| Writing Correction      | Corrects Korean sentences using AI              |
| Conversation Generation | Generates Korean conversation examples by topic |
| Level Test              | Estimates the user's Korean level               |
| Learning History        | Stores and retrieves user learning records      |
| Usage Tracking          | Tracks daily AI usage by user                   |
| User Authentication     | Uses Cognito-based login and JWT authentication |

---

## 3. Architecture Versions

## 3.1 Serverless Version

The Serverless version is the main operating version of KoreanMate.

It is designed for cost efficiency, managed service usage, authentication, observability, and operational documentation.

```text
User
  ↓
CloudFront + WAF
  ↓
S3 Static Frontend
  ↓
API Gateway HTTP API + JWT Authorizer
  ↓
Lambda Functions
  ↓
DynamoDB / Bedrock
```

Main components:

| Area             | Technology                       |
| ---------------- | -------------------------------- |
| Frontend Hosting | S3, CloudFront                   |
| API              | API Gateway HTTP API             |
| Compute          | AWS Lambda                       |
| Auth             | Amazon Cognito                   |
| Database         | DynamoDB                         |
| AI               | Amazon Bedrock                   |
| Security         | IAM, KMS, WAF, CloudTrail        |
| Observability    | CloudWatch, X-Ray, Grafana Cloud |
| Cost Control     | Usage limit, AWS Budgets         |
| CI/CD            | GitHub Actions, GitHub OIDC      |
| IaC              | Terraform                        |

---

## 3.2 EKS Version

The EKS version is a separate validation environment for Kubernetes operations.

It is not intended to replace the Serverless version.
It is used to demonstrate container deployment, GitOps, IRSA, security scanning, and Kubernetes monitoring.

```text
User / API Client
  ↓
Application Load Balancer
  ↓
Kubernetes Ingress
  ↓
Kubernetes Service
  ↓
Backend Pod
  ↓
IRSA
  ↓
DynamoDB / SSM Parameter Store / Bedrock
```

Main components:

| Area          | Technology                        |
| ------------- | --------------------------------- |
| Container     | Docker                            |
| Registry      | Amazon ECR                        |
| Orchestration | Amazon EKS                        |
| Ingress       | AWS Load Balancer Controller, ALB |
| IAM           | IRSA                              |
| GitOps        | Argo CD                           |
| Security Scan | Trivy                             |
| Monitoring    | Prometheus, Grafana               |
| IaC           | Terraform                         |
| CI/CD         | GitHub Actions                    |

---

## 4. Serverless vs EKS

| Item          | Serverless Version                 | EKS Version                          |
| ------------- | ---------------------------------- | ------------------------------------ |
| Role          | Main operating version             | Kubernetes validation version        |
| Compute       | Lambda                             | EKS Backend Pod                      |
| API Entry     | API Gateway                        | ALB Ingress                          |
| Deployment    | GitHub Actions + Terraform         | GitHub Actions + ECR + Argo CD       |
| AWS Access    | Lambda Execution Role              | IRSA Pod Role                        |
| Observability | CloudWatch / X-Ray / Grafana Cloud | Prometheus / Grafana                 |
| Cost Model    | Request-based cost                 | Cluster / Node / ALB continuous cost |
| Maintenance   | Can be kept running                | Destroy or minimize after validation |

More details: [Project Overview](./docs/overview.md)

---

## 5. Repository Structure

```text
apps/
├── frontend/
└── backend/

infra/
├── serverless/
└── eks/

deploy/
└── k8s/
    ├── backend/
    ├── argocd/
    └── monitoring/

docs/
├── overview.md
├── serverless/
│   ├── project-plan.md
│   ├── architecture.md
│   ├── runbook.md
│   ├── troubleshooting.md
│   └── evidence.md
│
└── eks/
    ├── project-plan.md
    ├── architecture.md
    ├── runbook.md
    ├── troubleshooting.md
    └── evidence.md
```

---

## 6. Documentation

## Common

* [Project Overview](./docs/overview.md)

## Serverless Version

* [Serverless Project Plan](./docs/serverless/project-plan.md)
* [Serverless Architecture](./docs/serverless/architecture.md)
* [Serverless Runbook](./docs/serverless/runbook.md)
* [Serverless Troubleshooting](./docs/serverless/troubleshooting.md)
* [Serverless Evidence](./docs/serverless/evidence.md)

## EKS Version

* [EKS Project Plan](./docs/eks/project-plan.md)
* [EKS Architecture](./docs/eks/architecture.md)
* [EKS Runbook](./docs/eks/runbook.md)
* [EKS Troubleshooting](./docs/eks/troubleshooting.md)
* [EKS Evidence](./docs/eks/evidence.md)

---

## 7. Key Validation Evidence

## Serverless Evidence

* CloudFront frontend deployment
* API Gateway JWT Authorizer
* Lambda API execution
* DynamoDB user-based data storage
* Cognito JWT `sub` based user isolation
* Bedrock integration
* Usage limit 429 response
* CloudWatch Logs / X-Ray traces
* CloudTrail audit logging
* AWS Budgets and SNS Email notification
* GitHub Actions deployment with OIDC

## EKS Evidence

* EKS Cluster and NodeGroup creation
* ECR backend image push
* GitHub Actions Docker image build
* Trivy image scan
* AWS Load Balancer Controller
* Backend Pod IRSA
* Kubernetes Deployment / Service / Ingress
* ALB `/health` and API validation
* Argo CD `Synced` / `Healthy`
* Prometheus Targets `UP`
* Grafana Backend Pod metrics

---

## 8. Cost Control Strategy

The Serverless version is designed to be kept as the main cost-optimized operating version.

The EKS version is used for validation and documentation because EKS creates continuous costs even when traffic is low.

EKS cost-related resources include:

* EKS Control Plane
* Worker Nodes
* Application Load Balancer
* EBS volumes
* CloudWatch Logs
* Prometheus / Grafana resources

After validation, screenshots, and documentation are completed, the EKS resources should be minimized or destroyed.

```bash
cd infra/eks/envs/dev
terraform destroy
```

---

## 9. Troubleshooting and Operations

This project includes operational documentation to show how issues were investigated and resolved.

| Document        | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| Runbook         | Operational checks and recovery steps                      |
| Troubleshooting | Real issues, root causes, attempts, and lessons learned    |
| Evidence        | Screenshots and command results proving the implementation |

Key troubleshooting topics include:

* Terraform remote state issue
* Cognito `dev-user-001` fallback removal
* CloudTrail KMS security scan warning
* Grafana CloudWatch Logs permission issue
* Backend Pod environment variable issue
* Argo CD Redis Secret issue
* EKS node Pod capacity issue
* Prometheus Pending issue

---

## 10. Project Highlights

* Built an AI Korean learning assistant with AWS services
* Implemented user-based AI usage limits to control Bedrock cost
* Used Cognito JWT `sub` for user data isolation
* Managed infrastructure with Terraform
* Built a cost-optimized Serverless version as the main architecture
* Built a separate EKS version to validate Kubernetes operations
* Automated CI/CD with GitHub Actions
* Removed long-term AWS credentials from deployment using GitHub OIDC
* Used IRSA for Pod-level AWS permissions in EKS
* Added Trivy security scanning
* Verified monitoring with CloudWatch, X-Ray, Grafana Cloud, Prometheus, and Grafana
* Documented evidence, runbooks, and troubleshooting records

---

## 11. Summary

KoreanMate demonstrates both cost-optimized serverless operations and Kubernetes-based cloud engineering.

The Serverless version shows how to build and operate a practical AI web application with managed AWS services.

The EKS version shows how the same backend can be containerized, deployed to Kubernetes, secured with IRSA, managed with GitOps, scanned with Trivy, and monitored with Prometheus/Grafana.

This project is designed as a cloud and DevOps engineering portfolio with practical documentation, operational evidence, and cost-aware infrastructure decisions.
