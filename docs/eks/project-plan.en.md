# KoreanMate EKS Project Plan

> Related documents: `docs/overview.md`, `docs/eks/eks-design.md`, `docs/eks/runbook.md`, `docs/eks/troubleshooting.md`, `docs/eks/evidence.md`

---

## 1. Project Overview

The KoreanMate EKS version is an extension of the existing KoreanMate backend designed to validate how the service can run in a Kubernetes-based environment.

KoreanMate is an AI-powered Korean learning web application for foreign learners. Users can use Korean writing correction, situational conversation generation, and level test features. Learning results and usage data are stored per user.

The purpose of the EKS version is not to add new product features. Instead, it containerizes the existing Backend API and deploys it to Amazon EKS in order to validate a Kubernetes-based operating model.

This project is intended to demonstrate the following capabilities:

* Docker-based backend containerization
* Image storage using Amazon ECR
* EKS Cluster and NodeGroup provisioning with Terraform
* Kubernetes Deployment, Service, and Ingress configuration
* ALB Ingress integration using AWS Load Balancer Controller
* Pod-level AWS permission control using IRSA
* Docker image build, scan, and push automation with GitHub Actions
* Container image security scanning with Trivy
* GitOps deployment with Argo CD
* Kubernetes observability with Prometheus and Grafana
* EKS cost management and post-validation resource cleanup strategy

---

## 2. Problem Definition

To demonstrate a Kubernetes-based operating environment in a portfolio, simply running an application as a container is not enough.

An EKS-based environment requires solving the following operational problems directly.

| Problem | Description |
|---|---|
| Need to separate the container runtime model | Unlike Lambda-based code, the EKS backend must run as a long-running HTTP server. |
| Need for automated image deployment | If Docker images are built and pushed manually, deployment history becomes unclear. |
| Need for AWS permission management | Pods need a secure way to access DynamoDB, SSM Parameter Store, and Bedrock. |
| Need for external traffic routing | An ALB Ingress is required so external users can access Kubernetes internal Services. |
| Need to validate GitOps operations | Kubernetes manifest changes should be deployed based on Git as the source of truth. |
| Need for container security validation | Without image vulnerability scanning, it is difficult to explain the security level of the runtime image. |
| Need for Kubernetes observability | Pod, Namespace, and Node status must be observable through metrics. |
| Risk of cost increase | EKS Cluster, NodeGroup, ALB, and Monitoring Stack resources continuously generate cost while they exist. |

The KoreanMate EKS version aims to solve these problems and validate a practical Kubernetes operating flow.

---

## 3. Project Goals

### 3.1 Service Goals

| Goal | Description |
|---|---|
| Containerize the Backend API | Configure the existing Backend API so it can run as an Express-based HTTP server. |
| Validate EKS deployment | Deploy the Backend Pod to an EKS Cluster and expose it through a Kubernetes Service. |
| Validate external API access | Call `/health`, `/correction`, `/conversation`, and `/level-test` through ALB Ingress. |
| Maintain AWS service integration | Allow the Backend Pod to access DynamoDB, SSM Parameter Store, and Bedrock. |
| Validate GitOps deployment | Configure Argo CD to watch and sync Kubernetes manifests from the GitHub repository. |
| Validate observability | Use Prometheus and Grafana to check EKS Cluster, Namespace, and Backend Pod metrics. |

### 3.2 Infrastructure Goals

| Goal | Description |
|---|---|
| Configure an EKS Cluster | Create an EKS Cluster and Managed NodeGroup with Terraform. |
| Configure an ECR Repository | Create an ECR Repository for storing the Backend Docker image. |
| Configure ALB Ingress | Use AWS Load Balancer Controller to create an ALB from Kubernetes Ingress. |
| Configure IRSA | Attach separate IAM Roles to the Backend Pod and AWS Load Balancer Controller. |
| Manage Kubernetes manifests | Manage Namespace, ServiceAccount, Deployment, Service, and Ingress as code. |
| Configure GitHub Actions | Automate Docker build, Trivy scan, and ECR push. |
| Configure Argo CD | Manage EKS deployment state based on manifests in the GitHub repository. |
| Configure Monitoring Stack | Install Prometheus, Grafana, kube-state-metrics, and node-exporter. |
| Manage cost | Scale down the NodeGroup or destroy EKS resources after validation. |

### 3.3 Portfolio Goals

This project is intended to demonstrate the following skills:

* Kubernetes-based application deployment
* EKS Cluster and NodeGroup configuration
* Docker image build and ECR push automation
* Understanding of Kubernetes Service and Ingress traffic flow
* Experience integrating AWS Load Balancer Controller with ALB
* Understanding of pod-level AWS permission control with IRSA
* GitOps operations using Argo CD
* Kubernetes metrics observability using Prometheus and Grafana
* Container image security scanning with Trivy
* Operational judgment around EKS cost structure and resource cleanup after validation
* Documentation skills through Troubleshooting, Runbook, and Evidence documents

---

## 4. Main Users and Usage Scenario

### 4.1 Main Users

The main audience for the KoreanMate EKS version is not an end user of the learning application, but a technical interviewer or a cloud/DevOps reviewer evaluating the portfolio.

### 4.2 Basic Validation Scenario

1. A developer modifies the Backend code.
2. GitHub Actions builds the Backend Docker image.
3. Trivy scans the Docker image.
4. The image is pushed to Amazon ECR.
5. Kubernetes Deployment runs the Backend Pod using the ECR image.
6. AWS Load Balancer Controller creates an ALB based on the Ingress resource.
7. The `/health` endpoint and main APIs are called through the ALB address.
8. Argo CD is checked to confirm the Application is `Synced` and `Healthy`.
9. Prometheus Targets are checked to confirm they are `UP`.
10. Grafana is used to check the `koreanmate` namespace and Backend Pod metrics.
11. After validation, the NodeGroup is scaled down or EKS resources are deleted to reduce cost.

---

## 5. Scope

### 5.1 Implemented Scope

| Area | Feature |
|---|---|
| Backend | Express-based HTTP server entrypoint |
| Backend | `/health` endpoint |
| Backend | `/correction` API |
| Backend | `/conversation` API |
| Backend | `/level-test` API |
| Container | Backend Dockerfile |
| Container | Local Docker runtime validation |
| Registry | Amazon ECR Repository |
| CI/CD | GitHub Actions Docker image build |
| CI/CD | GitHub Actions ECR push |
| Security | Trivy image scan |
| Infra | Terraform EKS Cluster |
| Infra | Terraform Managed NodeGroup |
| Infra | Terraform ECR |
| Infra | Terraform IRSA |
| Kubernetes | Namespace |
| Kubernetes | ServiceAccount |
| Kubernetes | Deployment |
| Kubernetes | Service |
| Kubernetes | Ingress |
| Ingress | AWS Load Balancer Controller |
| GitOps | Argo CD installation |
| GitOps | Argo CD Application |
| Monitoring | Prometheus |
| Monitoring | Grafana |

### 5.2 Future Expansion Scope

| Area | Feature | Description |
|---|---|---|
| Scaling | HPA | Automatically scale Backend Pods based on CPU or memory usage. |
| Scaling | Cluster Autoscaler or Karpenter | Automatically scale NodeGroups. |
| Security | NetworkPolicy | Restrict network access between Pods. |
| Security | External Secrets Operator | Integrate AWS Secrets Manager with Kubernetes Secrets. |
| Security | cert-manager | Automate HTTPS certificate issuance. |
| Observability | Loki | Collect Kubernetes logs. |
| Observability | Custom Dashboard | Build dashboards focused on API latency, errors, and request count. |
| Release | Blue/Green or Canary | Add progressive deployment strategies. |
| Domain | Route 53 | Use a domain name instead of direct ALB DNS access. |
| Environment | Separate prod environment | Separate dev and prod EKS environments. |

### 5.3 Out of Scope for the Current Version

| Excluded Item | Reason |
|---|---|
| Frontend Pod deployment | The main focus of the EKS validation is backend operations. The frontend can remain on the existing static hosting model. |
| HTTPS certificate | For dev validation, API access can be verified through ALB HTTP. |
| Route 53 domain connection | External access can be validated with the ALB DNS name. |
| HPA / Autoscaler | These are separated as future improvements after basic operational validation. |
| Loki log collection | The current priority is Prometheus/Grafana metrics validation. |
| Long-term operation | EKS continuously generates cost, so resources should be deleted or minimized after validation. |
| Multi-cluster architecture | This is excessive for a portfolio-level dev environment. |

---

## 6. Requirements

### 6.1 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The Backend must be built as a Docker image. | High |
| FR-02 | The Backend must run as an HTTP server in a container environment. | High |
| FR-03 | The `/health` API must respond successfully in the EKS environment. | High |
| FR-04 | The `/correction` API must be callable through ALB Ingress. | High |
| FR-05 | The `/conversation` API must be callable through ALB Ingress. | High |
| FR-06 | The `/level-test` API must be callable through ALB Ingress. | High |
| FR-07 | The Backend Pod must be able to access DynamoDB, SSM, and Bedrock. | High |
| FR-08 | Kubernetes manifests must be managed in the Git repository. | High |
| FR-09 | Argo CD must manage the Backend Application in `Synced` and `Healthy` state. | Medium |
| FR-10 | Backend Pod metrics must be visible in Prometheus and Grafana. | Medium |

### 6.2 Non-functional Requirements

| Category | Requirement |
|---|---|
| Availability | In the dev validation environment, the Backend Pod and ALB Ingress must respond successfully. |
| Security | Pods must not use AWS Access Keys directly and must access AWS services through IRSA. |
| Deployment | Docker image build, scan, and push must be automated through GitHub Actions. |
| Deployment traceability | Kubernetes manifests must be traceable through the Git repository and Argo CD. |
| Observability | Pod, Namespace, and Node metrics must be visible through Prometheus and Grafana. |
| Maintainability | Kubernetes manifests must be managed under `deploy/k8s`. |
| Cost | After validation, the NodeGroup must be scaled down or EKS resources must be deleted. |

---

## 7. Traffic and Operations Assumptions

This EKS version does not assume large-scale production traffic.  
Its purpose is to validate Kubernetes operations and collect portfolio evidence.

| Item | Assumption |
|---|---|
| Initial users | A small number of users for portfolio validation |
| Daily requests | Around 10 to 100 test requests |
| Main API requests | health, correction, conversation, level-test |
| Backend Pod count | 1 by default |
| Node count | 1 to 3 depending on the validation stage |
| Traffic pattern | Short API requests |
| Operation period | Until setup, validation, capture, and documentation are completed |
| Cost policy | Scale down the NodeGroup or destroy resources after validation |

---

## 8. Tech Stack

| Area | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express |
| Container | Docker |
| Image Registry | Amazon ECR |
| Orchestration | Amazon EKS |
| Kubernetes | Deployment, Service, Ingress, ServiceAccount, Namespace |
| Load Balancing | AWS Load Balancer Controller, Application Load Balancer |
| IAM | IRSA, IAM Role, IAM Policy |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Security Scan | Trivy |
| GitOps | Argo CD |
| Monitoring | Prometheus, Grafana, kube-state-metrics, node-exporter |
| AWS Services | DynamoDB, SSM Parameter Store, Amazon Bedrock |
| Region | ap-northeast-2 |

---

## 9. Technology Selection Rationale

### 9.1 Amazon EKS

Amazon EKS is used to configure and validate a Kubernetes operating environment directly. Since AWS manages the Kubernetes control plane, the project can focus on Worker Nodes, Pod deployment, Ingress, IAM integration, and observability.

### 9.2 Docker

The Backend application is packaged as a Docker image to run on EKS. The Dockerfile fixes the runtime environment and reduces differences between local execution and EKS execution.

### 9.3 Amazon ECR

Amazon ECR is used to store the Backend Docker image. The image built by GitHub Actions is pushed to ECR, and the Kubernetes Deployment pulls that image to run the Backend Pod.

### 9.4 GitHub Actions

GitHub Actions handles Docker image build, Trivy scan, and ECR push automation. Automating image build and security scanning reduces manual deployment mistakes and keeps deployment history in GitHub Actions logs.

### 9.5 Trivy

Trivy is used to scan the Backend Docker image for vulnerabilities. This includes container image security checks in the CI/CD flow.

### 9.6 AWS Load Balancer Controller

AWS Load Balancer Controller is used to create an AWS Application Load Balancer from Kubernetes Ingress resources. This allows the external traffic entry point to be managed through Kubernetes manifests.

### 9.7 IRSA

IRSA is used so Pods can access AWS services without long-term AWS Access Keys. The Backend Pod accesses DynamoDB, SSM Parameter Store, and Bedrock through the IAM Role attached to its ServiceAccount.

### 9.8 Argo CD

Argo CD is used to synchronize Kubernetes manifests based on the Git repository. This enables GitOps-based deployment state management and validation through `Synced` and `Healthy` status.

### 9.9 Prometheus / Grafana

Prometheus and Grafana are used to observe EKS Cluster and Backend Pod metrics. Prometheus collects Kubernetes metrics, and Grafana visualizes metrics at the Cluster, Namespace, and Pod levels.

---

## 10. Architecture Overview

The detailed architecture is managed in `docs/eks/eks-design.md`.

The summary structure is as follows.

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

CI/CD
  ↓
GitHub Actions
  ↓
Docker Build
  ↓
Trivy Image Scan
  ↓
Amazon ECR Push

GitOps
  ↓
GitHub Repository
  ↓
Argo CD
  ↓
EKS Backend Deployment

Observability
  ↓
Prometheus
  ↓
Grafana
  ↓
Cluster / Namespace / Backend Pod Metrics
```

---

## 11. Kubernetes Resource Design Overview

### 11.1 Namespace

| Item | Value |
|---|---|
| Namespace | koreanmate |
| Purpose | Separate Backend Application resources |

### 11.2 ServiceAccount

| Item | Value |
|---|---|
| Name | backend |
| Namespace | koreanmate |
| Purpose | Attach the IRSA Role to the Backend Pod |

### 11.3 Deployment

| Item | Value |
|---|---|
| Name | backend |
| Replicas | 1 |
| Container Port | 3000 |
| Image | ECR `koreanmate-dev-backend:dev` |
| Runtime | Node.js Express |
| Health Endpoint | `/health` |

### 11.4 Service

| Item | Value |
|---|---|
| Name | backend |
| Type | ClusterIP |
| Port | 80 |
| Target Port | 3000 |
| Purpose | Forward internal traffic between Ingress and the Backend Pod |

### 11.5 Ingress

| Item | Value |
|---|---|
| Controller | AWS Load Balancer Controller |
| Load Balancer | Application Load Balancer |
| Scheme | internet-facing |
| Target Type | ip |
| Health Check Path | `/health` |
| Purpose | Provide external API access |

---

## 12. Port Usage Plan

In the EKS version, Kubernetes internal communication, external ALB access, and local validation port-forwarding are separated.

### 12.1 Application and Kubernetes Ports

| Category | Port | Description |
|---|---:|---|
| Backend Container | 3000 | Port used by the Express-based Backend HTTP server inside the container |
| Kubernetes Service | 80 | Backend Service port accessed by Ingress or port-forward |
| Service Target Port | 3000 | Port where the Service forwards traffic to the Backend Pod |
| ALB HTTP | 80 | Port used by external API clients to access the Backend API through ALB |

The Backend Pod runs on port `3000` inside the container.  
The Kubernetes Service exposes port `80`, and actual traffic is forwarded to the Backend Pod on port `3000`.

```text
ALB :80
  ↓
Ingress
  ↓
Service :80
  ↓
Backend Pod :3000
```

### 12.2 Local Validation Port-forwarding

The following port-forwarding setup was used to validate EKS internal resources from a local browser or terminal.

| Target | Local Port | Cluster Port | Purpose |
|---|---:|---:|---|
| Backend Service | 8081 | 80 | Local validation of the `/health` API |
| Argo CD Server | 8082 | 443 | Access to the Argo CD Web UI |
| Prometheus | 9090 | 9090 | Check Prometheus Targets and metrics |
| Grafana | 3002 | 80 | Access to the Grafana Dashboard |

Example commands:

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
kubectl port-forward svc/argocd-server -n argocd 8082:443
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

Local validation ports are not production traffic ports. They are temporary access ports used to inspect EKS internal resources from a browser or terminal.

### 12.3 Port Usage Principles

| Principle | Description |
|---|---|
| Production access | External API access uses the ALB DNS name and HTTP port 80. |
| Internal communication | Kubernetes uses the Service 80 → Pod 3000 structure internally. |
| Local validation | Backend, Argo CD, Prometheus, and Grafana use separate local ports to avoid conflicts. |
| Documentation | Port-forward ports used in Evidence and Troubleshooting are recorded together with the relevant captures. |

Because multiple tools had to be checked at the same time during the EKS validation, port-forwarding ports were clearly separated. This made it possible to validate the Backend API, Argo CD UI, Prometheus, and Grafana at the same time.

---

## 13. Security Requirements

| Item | Design |
|---|---|
| Image security | Run Trivy image scan in GitHub Actions |
| Registry access | Store Backend image in ECR |
| Pod AWS permissions | Use Backend Pod IRSA Role |
| ALB permissions | Use AWS Load Balancer Controller IRSA Role |
| Permission scope | Grant the Backend Pod only the required DynamoDB, SSM, and Bedrock permissions |
| Access Key management | Do not store long-term AWS Access Keys inside the Pod |
| ServiceAccount separation | Use a dedicated ServiceAccount for the Backend |
| GitOps management | Manage Kubernetes manifests based on Git |
| Secret management | Move sensitive values to Kubernetes Secret or External Secrets in the future |

---

## 14. Cost Optimization Strategy

EKS generates cost as long as the cluster and NodeGroups exist, even when traffic is low.  
Therefore, this project is intended for validation and evidence collection rather than always-on operation.

| Item | Strategy |
|---|---|
| EKS Control Plane | Destroy after validation |
| Worker Node | Temporarily scale from 1 to 3 nodes depending on the validation stage |
| ALB | Destroy after Ingress validation |
| Monitoring Stack | Delete after captures are completed |
| EBS Volume | Check for remaining volumes after destroy |
| CloudWatch Logs | Minimize unnecessary log output |
| NAT Gateway | Exclude or minimize in the default design to reduce cost |

Cost management principles:

```text
1. Validate the Backend with the minimum NodeGroup first
2. Temporarily scale the NodeGroup only when validating Argo CD / Monitoring
3. Scale down the NodeGroup or run terraform destroy after captures and documentation are complete
```

---

## 15. Operations and Monitoring Strategy

| Tool | Purpose |
|---|---|
| kubectl | Check Pods, Services, Ingresses, and Events |
| Argo CD | Check Application Synced / Healthy status |
| Prometheus | Collect Kubernetes metrics |
| Grafana | Visualize Cluster, Namespace, and Backend Pod metrics |
| AWS Console | Check ALB, Target Group, ECR, and IAM Role |
| Terraform | Change or destroy EKS resources |
| GitHub Actions | Check image build, scan, and push history |

Key metrics and checks:

| Area | Checks |
|---|---|
| Node | Ready status, Pod capacity, CPU/Memory |
| Pod | Running status, Restart count, logs |
| Service | Endpoint existence |
| Ingress | ALB DNS creation, Target health |
| Argo CD | Synced, Healthy |
| Prometheus | Targets UP |
| Grafana | Backend Pod CPU, Memory, Network metrics |

---

## 16. CI/CD and GitOps Strategy

### 16.1 Image Build Pipeline

GitHub Actions builds the Backend Docker image, runs Trivy scan, and pushes the image to ECR.

| Step | Role |
|---|---|
| Checkout | Check out the GitHub source code |
| AWS Auth | Configure GitHub OIDC or AWS authentication |
| ECR Login | Log in to Amazon ECR |
| Docker Build | Build the Backend Docker image |
| Trivy Scan | Scan the image for vulnerabilities |
| Docker Push | Push the image to ECR |

### 16.2 Kubernetes Deployment Strategy

Kubernetes manifests are managed under the `deploy/k8s/backend` path in the Git repository.

The Argo CD Application syncs based on the following configuration.

| Item | Value |
|---|---|
| Repository | GitHub Repository |
| Target Revision | eks |
| Path | deploy/k8s/backend |
| Destination | in-cluster |
| Namespace | koreanmate |
| Sync Policy | Automated, Prune, SelfHeal |

---

## 17. WBS and Schedule Plan

| Step | Period | Category | Main Task | Deliverable |
|---:|---|---|---|---|
| 1 | Week 3 | Preparation | Create an EKS validation branch and define separation from the Serverless version | eks branch |
| 2 | Week 3 | Planning | Define the EKS version goal, validation scope, and cost management criteria | project-plan.md |
| 3 | Week 3 | Backend | Add an Express HTTP server entrypoint separate from the Lambda-based backend | `src/server` |
| 4 | Week 3 | Backend | Run the local HTTP server and validate the health check | `/health` response |
| 5 | Week 3 | Container | Write a Dockerfile for the Backend container image | backend.Dockerfile |
| 6 | Week 3 | Container | Validate the Backend container in a local Docker environment | Docker container |
| 7 | Week 3 | Registry | Configure a container image repository for EKS deployment | ECR Repository |
| 8 | Week 3 | CI/CD | Configure a GitHub Actions image build / push workflow | eks-image-build.yml |
| 9 | Week 3 | Security | Add a container image vulnerability scan step | Trivy scan log |
| 10 | Week 3 | Infra | Create the base directory and module structure for EKS Terraform configuration | EKS env/module |
| 11 | Week 3 | Infra | Configure and validate VPC, EKS Cluster, and NodeGroup | EKS Cluster |
| 12 | Week 3 | Ingress | Install and validate AWS Load Balancer Controller | Controller Pod |
| 13 | Week 3 | IAM | Configure IRSA for ALB Controller and validate permission separation | IAM Role / ServiceAccount |
| 14 | Week 3 | IAM | Configure IRSA for Backend Pod and separate AWS service access permissions | Backend IAM Role |
| 15 | Week 3 | Kubernetes | Write Namespace, ServiceAccount, and Deployment manifests | K8s manifest |
| 16 | Week 3 | Kubernetes | Write Service and Ingress manifests and configure the ALB connection | ALB Ingress |
| 17 | Week 3 | Validation | Deploy the Backend Pod and validate the internal Kubernetes health check | `/health` success |
| 18 | Week 3 | Validation | Validate external API calls through ALB Ingress | API success |
| 19 | Week 3 | GitOps | Install Argo CD and configure the GitOps validation environment | Argo CD Pods |
| 20 | Week 3 | GitOps | Configure Argo CD Application and check manifest sync status | Synced / Healthy |
| 21 | Week 3 | Observability | Configure the Prometheus / Grafana monitoring stack | Monitoring Stack |
| 22 | Week 3 | Observability | Check Prometheus Targets and basic Grafana metrics | Dashboard capture |
| 23 | Week 3 | Documentation | Capture and organize EKS setup and validation results | `evidence.md` |
| 24 | Week 3 | Documentation | Document errors and resolution steps encountered during the process | `troubleshooting.md` |
| 25 | Week 3 | Documentation | Document operational check and recovery procedures | `runbook.md` |
| 26 | Week 3 | Documentation | Document EKS architecture design intent and components | `eks-design.md` |
| 27 | Week 3 | Cost Management | Scale down the NodeGroup or run Terraform destroy after validation | Cost control |

---

## 18. Key Risks and Mitigation Plans

| Risk | Impact | Mitigation |
|---|---|---|
| EKS cost increase | Higher-than-expected cost | Scale down the NodeGroup or run `terraform destroy` after validation |
| Insufficient Node Pod capacity | Argo CD / Monitoring Pods remain Pending | Temporarily scale the NodeGroup |
| Missing environment variables | Backend Pod enters CrashLoopBackOff | Validate Deployment environment variables |
| Incorrect ECR image tag | Old image deployment or ImagePullBackOff | Check GitHub Actions logs and ECR image digest |
| IRSA permission error | Failure to access DynamoDB / Bedrock / SSM | Check ServiceAccount annotation and IAM Trust Policy |
| ALB creation failure | External API access unavailable | Check AWS Load Balancer Controller logs and Ingress Events |
| Argo CD OutOfSync | Git and Cluster state mismatch | Check Application diff and run Sync |
| Prometheus Pending | Monitoring validation unavailable | Temporarily scale NodeGroup or adjust resource requests |
| Local port-forward confusion | Failure to access Grafana / Prometheus | Separate terminals by port and verify URLs |
| Remaining resources | Continued cost after destroy | Check for remaining ALB, EBS, and EKS Cluster resources |

---

## 19. Current Limitations and Future Improvements

The current EKS version is designed for a portfolio validation `dev` environment.  
To expand it toward a production-level environment, the following improvements are required.

| Item | Current State | Improvement |
|---|---|---|
| HTTPS | Validated with ALB HTTP | Configure ACM + Ingress HTTPS |
| Domain | Direct ALB DNS access | Connect Route 53 domain |
| Scaling | 1 replica | Add HPA |
| Node Scaling | Manual NodeGroup adjustment | Add Cluster Autoscaler or Karpenter |
| Secret management | Mainly Deployment environment variables | Apply External Secrets Operator |
| Logging | Mainly `kubectl logs` | Consider Loki or CloudWatch Container Insights |
| Deployment strategy | Basic Rolling Update | Consider Blue/Green or Canary deployment |
| Security policy | Default Kubernetes network | Apply NetworkPolicy |
| Cost management | Manual destroy | Add TTL-based cleanup or a separate cleanup workflow |
| Environment separation | dev-focused | Separate prod environment |

---

## 20. Final Deliverables

| Document | Purpose |
|---|---|
| `docs/overview.md` | Summarize the relationship, purpose, and comparison between the Serverless and EKS versions |
| `docs/eks/project-plan.md` | Document the EKS version's purpose, scope, requirements, schedule, and risks |
| `docs/eks/eks-design.md` | Document EKS architecture, request flow, GitOps, IRSA, and Monitoring design |
| `docs/eks/runbook.md` | Document operational checks and recovery procedures for possible incidents |
| `docs/eks/troubleshooting.md` | Document actual issues, root causes, resolution steps, and lessons learned |
| `docs/eks/evidence.md` | Organize EKS setup and validation captures |

---

## 21. Core Differentiators

The key differentiators of the KoreanMate EKS version are as follows.

* Extended the existing Backend into an Express-based HTTP server for containerized execution.
* Created a Dockerfile and validated local Docker execution first.
* Automated Docker image build, Trivy scan, and ECR push with GitHub Actions.
* Provisioned ECR, EKS Cluster, NodeGroup, and IRSA with Terraform.
* Used AWS Load Balancer Controller to create an ALB from Kubernetes Ingress.
* Configured the Backend Pod to access DynamoDB, SSM, and Bedrock through IRSA without AWS Access Keys.
* Validated Kubernetes deployment using GitOps with Argo CD.
* Checked the `koreanmate` namespace and Backend Pod metrics with Prometheus and Grafana.
* Included container security validation through Trivy image scanning.
* Documented the strategy to scale down or destroy EKS resources after validation based on the EKS cost structure.
* Documented the setup process and operational response through Evidence, Troubleshooting, and Runbook documents.
