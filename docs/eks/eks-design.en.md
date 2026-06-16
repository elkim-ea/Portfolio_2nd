# KoreanMate EKS Design

> Purpose: This document explains the design intent of the KoreanMate EKS version, including Kubernetes resource structure, request processing flow, GitOps deployment flow, IRSA-based AWS permission control, observability, security, and cost management strategies for portfolio and interview use.  
> Baseline environment: AWS Seoul Region `ap-northeast-2`, EKS `dev` environment, Terraform-based IaC

---

## 1. Project Overview

The KoreanMate EKS version is an architecture designed to run the KoreanMate backend as a containerized application and validate Kubernetes operations on Amazon EKS.

After logging in from the React frontend, users can use writing correction, situational conversation generation, and level test features. API requests include a JWT and are sent to an Application Load Balancer. The requests are then routed through Kubernetes Ingress and Service resources to the Backend Pod. The Backend Pod accesses DynamoDB, SSM Parameter Store, and Amazon Bedrock through IRSA.

The key purpose of this design is not simply to run the application in a container, but to build an operational flow that includes **EKS-based deployment**, **ALB Ingress**, **IRSA-based permission separation**, **GitOps**, **container image security scanning**, and **Kubernetes observability**.

The main technology stack is as follows.

| Area | Technology |
|---|---|
| Frontend | React, Vite |
| Auth | Amazon Cognito |
| Backend | Node.js, TypeScript, Express |
| Container | Docker |
| Image Registry | Amazon ECR |
| Orchestration | Amazon EKS |
| Kubernetes | Namespace, ServiceAccount, Deployment, Service, Ingress |
| Load Balancing | AWS Load Balancer Controller, Application Load Balancer |
| AWS Access Control | IAM, IRSA |
| AI | Amazon Bedrock |
| Data | DynamoDB |
| Config | SSM Parameter Store |
| CI/CD | GitHub Actions, GitHub OIDC |
| Security Scan | Trivy |
| GitOps | Argo CD |
| Observability | Prometheus, Grafana, kube-state-metrics, node-exporter |
| IaC | Terraform |

**Why was this designed as an EKS-based architecture?**

The purpose of the KoreanMate EKS version is to demonstrate Kubernetes operational capability. For that reason, the backend was containerized as an Express-based HTTP server and connected with an EKS Cluster, NodeGroup, Service, Ingress, IRSA, GitOps, and a monitoring stack. This architecture makes it possible to explain common Kubernetes operations topics such as deployment, networking, permissions, and observability.

---

## 2. Design Goals

The goals of this design are as follows.

| Goal | Design Implementation |
|---|---|
| Validate a Kubernetes-based operating model | Configure EKS Cluster, Managed NodeGroup, Deployment, Service, and Ingress |
| Standardize the container runtime environment | Deploy using a backend Dockerfile and ECR image |
| Provide external API access | Configure ALB Ingress through the AWS Load Balancer Controller |
| Control AWS permissions at the Pod level | Connect the Backend ServiceAccount to an IRSA Role |
| Remove long-term AWS Access Keys | Use WebIdentity-based temporary credentials instead of storing Access Keys inside Pods |
| Automate image deployment | Build Docker image, run Trivy scan, and push to ECR through GitHub Actions |
| Manage deployment state from Git | Sync Kubernetes manifests through an Argo CD Application |
| Ensure Kubernetes observability | Check Cluster, Namespace, and Pod metrics using Prometheus and Grafana |
| Control cost | Reduce the NodeGroup size or delete EKS resources after validation |

**Why were the design goals separated by operational area?**

EKS is not meaningful as a single isolated resource. It only becomes useful when the Cluster, Nodes, Pods, Services, Ingress, IAM, CI/CD, and Monitoring work together. Therefore, the goals are not limited to “successful deployment.” They are separated into operational areas such as container image creation, external traffic handling, AWS permission integration, GitOps synchronization, and metrics validation.

---

## 3. Architecture Overview

<img src="./images/eks-design/eks-architecture-overview.png" width="1000">

The overall architecture is divided into the following layers.

| Layer | Components | Role |
|---|---|---|
| Client Layer | User, React Frontend | User input, login, and API request transmission |
| Authentication Layer | Amazon Cognito | Handles login and issues JWTs |
| Load Balancing Layer | Application Load Balancer | Forwards external HTTP requests to EKS Ingress |
| Kubernetes Network Layer | Ingress, Service | Routes ALB requests to the Backend Pod |
| Workload Layer | Deployment, Backend Pod | Runs the Express-based Backend API |
| AWS Managed Services Layer | DynamoDB, SSM Parameter Store, Bedrock | Stores data, manages configuration, and generates AI responses |
| Container Registry Layer | Amazon ECR | Stores the Backend Docker image |
| IAM Layer | IRSA, IAM Role | Controls AWS API access at the Pod level |
| GitOps Layer | Argo CD | Synchronizes Kubernetes manifests based on the Git repository |
| Observability Layer | Prometheus, Grafana | Collects and visualizes Cluster, Namespace, and Pod metrics |

Requests enter through the ALB. The ALB forwards traffic to Kubernetes Ingress. Ingress forwards requests to the Service, and the Service forwards them to the Backend Pod’s container port. The Backend Pod accesses DynamoDB, SSM Parameter Store, and Bedrock through the IRSA Role connected to its ServiceAccount.

ECR is not part of the runtime request path. ECR acts as the image registry that Kubernetes uses when pulling the Docker image during Pod startup. Argo CD and Prometheus/Grafana are also not part of the user request path. They belong to the operational management path.

**Why use the ALB → Ingress → Service → Pod structure?**

In Kubernetes, external requests should not be connected directly to Pods. Pods can be recreated and their IP addresses can change. A Service provides a stable internal entry point for a group of Pods, and Ingress manages HTTP routing rules. The AWS Load Balancer Controller creates an ALB based on the Ingress resource, which allows AWS resources and Kubernetes resources to be connected through manifests.

---

## 4. User Flow

<img src="./images/eks-design/user-flow.png" width="800">

The User Flow shows which screens the user goes through after accessing KoreanMate and how they reach the main features. This diagram explains the user-facing screen flow, not the internal Kubernetes structure.

The basic flow is as follows.

1. The user accesses the Home Page.
2. The user moves to the Login Page.
3. Existing users log in through Cognito authentication.
4. New users sign up on the Signup Page.
5. After signup, users confirm their account on the Confirm Signup Page.
6. Users who forgot their password reset it through the Forgot Password Page and Reset Password Page.
7. After successful login, the user moves to the Dashboard.
8. From the Dashboard, the user can access Level Test, Correction, Conversation, History, and Settings.
9. The user can end the authenticated session by logging out.

**Why include the User Flow in the EKS design document?**

Although the EKS design is infrastructure-focused, the Backend API is ultimately called from user actions in the frontend. Including the User Flow makes it easier to explain which screens require authentication and which screens trigger Backend API calls. In particular, Dashboard, Correction, Conversation, and Level Test after login are directly connected to JWT-based API requests.

---

## 5. Request Flow

<img src="./images/eks-design/request-flow.png" width="800">

The request processing flow is as follows.

1. The user sends a login request from the React Frontend.
2. Cognito issues a JWT.
3. The Frontend includes the JWT in the Authorization header when calling the API.
4. The request is sent to the Application Load Balancer.
5. The ALB routes the request based on the Kubernetes Ingress rules.
6. Ingress forwards the request to the Backend Service.
7. The Service forwards the request to the Backend Pod.
8. The Express API Handler inside the Backend Pod receives the request.
9. The Handler parses the request body and headers.
10. The Request Validation step validates the input.
11. For AI feature requests, the Usage Limit Check is performed first.
12. The Backend uses the model configuration managed in SSM Parameter Store.
13. The Backend calls Amazon Bedrock to generate the AI response.
14. The Backend stores the learning record and usage data in DynamoDB.
15. The API response is returned to the Frontend.
16. The user checks the result on the React Result Display.

**Why separate Validation and Usage Limit Check inside the Backend?**

Validation blocks invalid requests early. Usage Limit Check verifies the user’s quota before making a cost-generating Bedrock call. By separating these two steps, input errors and usage-limit violations can be handled as different causes, and cost control can be reliably applied before Bedrock is invoked.

**Why check DynamoDB usage before calling Bedrock?**

Bedrock incurs cost based on usage. If the application checks usage only after generating an AI response, the cost-control purpose becomes weak. The Backend checks the UsageLimits data in DynamoDB first and calls Bedrock only when the request is within the allowed limit. This is the core flow for implementing per-user daily AI usage limits.

---

## 6. Kubernetes Resource Design

The KoreanMate Backend runs inside the `koreanmate` namespace. Backend-related Kubernetes resources are managed under the `deploy/k8s/backend` path in the Git repository.

### 6.1 Namespace

| Item | Value |
|---|---|
| Name | `koreanmate` |
| Role | Isolates Backend application resources |

The `koreanmate` namespace is used to logically separate Backend Deployment, Service, Ingress, and ServiceAccount resources.

**Why separate the namespace?**

An EKS Cluster contains resources for different purposes, such as `kube-system`, `argocd`, and `monitoring`. Placing Backend resources in a separate namespace makes it easier to distinguish application resources from operational resources and narrow the inspection scope with commands such as `kubectl get pods -n koreanmate`.

### 6.2 ServiceAccount

| Item | Value |
|---|---|
| Name | `backend` |
| Namespace | `koreanmate` |
| Connected Permission | Backend Pod IRSA Role |
| Role | Connects AWS service access permissions for the Backend Pod |

The Backend ServiceAccount includes an annotation for the IRSA Role ARN. Only Pods that use this ServiceAccount have permission to access DynamoDB, SSM Parameter Store, and Bedrock.

**Why connect an IAM Role to the ServiceAccount?**

Putting AWS Access Keys inside a Pod creates key leakage risk and requires manual key rotation. With IRSA, a Kubernetes ServiceAccount can be connected to an IAM Role, allowing the Pod to call AWS APIs using temporary credentials. It also makes it possible to grant only the permissions needed by the Backend Pod and explain the permission boundary clearly.

### 6.3 Deployment

| Item | Value |
|---|---|
| Name | `backend` |
| Namespace | `koreanmate` |
| Replicas | `1` |
| Image | ECR `koreanmate-dev-backend:dev` |
| Container Port | `3000` |
| Runtime | Node.js Express |
| Health Endpoint | `/health` |

The Deployment manages the desired state of the Backend Pod. If a Pod is deleted or fails, the Deployment Controller creates it again.

**Why use a Deployment?**

The Backend API is a long-running HTTP server, so managing it through a Deployment is more appropriate than creating a single Pod directly. A Deployment provides basic operational capabilities such as replica management, rolling updates, and Pod recreation. In the portfolio dev environment, it starts with one replica, but it can be scaled later using replicas or HPA.

### 6.4 Service

| Item | Value |
|---|---|
| Name | `backend` |
| Type | `ClusterIP` |
| Port | `80` |
| Target Port | `3000` |
| Role | Forwards internal traffic between Ingress and Backend Pod |

The Service provides a stable internal entry point so that Ingress can reach the Backend even if Pod IPs change.

**Why configure the Service as ClusterIP?**

External exposure is handled by ALB Ingress, so the Service itself does not need to be a LoadBalancer type. A ClusterIP Service is accessible only inside the cluster, and Ingress forwards traffic to this Service. This separation keeps the external entry point consistently managed through Ingress and ALB.

### 6.5 Ingress

| Item | Value |
|---|---|
| Controller | AWS Load Balancer Controller |
| Load Balancer | Application Load Balancer |
| Scheme | `internet-facing` |
| Target Type | `ip` |
| Health Check Path | `/health` |
| Backend Service | `backend:80` |

Ingress connects external HTTP requests to the Backend Service. The AWS Load Balancer Controller creates the AWS ALB and Target Group based on the Ingress annotations and spec.

**Why use Ingress and the AWS Load Balancer Controller?**

The purpose is to manage external routing rules through Kubernetes manifests. If the ALB is created manually in the AWS Console, the relationship between Kubernetes resources and AWS resources is not preserved as code. With the AWS Load Balancer Controller, the ALB is created based on the Ingress manifest, and GitOps can manage the change history.

---

## 7. Port and Traffic Design

The port structure of the EKS version is as follows.

| Category | Port | Description |
|---|---:|---|
| ALB HTTP | 80 | External API request entry point |
| Kubernetes Service | 80 | Backend Service port accessed by Ingress |
| Backend Container | 3000 | Port used by the Express server inside the Pod |
| Backend local port-forward | 8081 → 80 | Local verification of Service health check |
| Argo CD local port-forward | 8082 → 443 | Access to the Argo CD UI |
| Prometheus local port-forward | 9090 → 9090 | Check Prometheus Targets |
| Grafana local port-forward | 3002 → 80 | Check Grafana Dashboard |

The traffic path is as follows.

```text
ALB :80
  ↓
Kubernetes Ingress
  ↓
Kubernetes Service :80
  ↓
Backend Pod :3000
```

**Why separate the Service port and the container port?**

From the external or Ingress perspective, accessing HTTP through the default port 80 is simpler. However, the Backend application runs inside the container on the Express server port 3000. By mapping `port: 80` to `targetPort: 3000`, the Service separates the external access port from the application runtime port.

---

## 8. Authentication and Authorization Design

User authentication is handled by Cognito, and the Frontend includes the JWT issued by Cognito in API requests.

| Item | Design |
|---|---|
| Login Handling | Amazon Cognito |
| Token | JWT |
| Frontend Request | `Authorization: Bearer <JWT>` |
| Backend Handling | Uses JWT-based user information in Express middleware or handler |
| User Identification | userId based on Cognito `sub` |

ALB and Kubernetes Ingress are responsible for forwarding HTTP requests to the Backend. User-specific data access control is handled by the Backend application based on JWT claims.

**Why not receive userId as a client input value?**

If the client sends userId directly, a user may be able to manipulate the ID of another user. By determining userId based on the authenticated JWT `sub`, the application reduces the risk of userId tampering. Therefore, the Backend should prioritize verified authentication information over userId values in the request body.

---

## 9. IRSA and IAM Design

The EKS version uses two types of IRSA Roles.

| Target | ServiceAccount | IAM Role | Purpose |
|---|---|---|---|
| AWS Load Balancer Controller | `kube-system/aws-load-balancer-controller` | ALB Controller Role | Manages ALB, Target Groups, and Listeners based on Ingress |
| Backend Pod | `koreanmate/backend` | Backend Pod Role | Accesses DynamoDB, SSM Parameter Store, and Bedrock |

The Trust Policy of the Backend Pod Role limits `AssumeRoleWithWebIdentity` to a specific ServiceAccount.

```text
system:serviceaccount:koreanmate:backend
```

The Backend Pod requires the following permissions.

| AWS Service | Purpose |
|---|---|
| DynamoDB | Store learning records, read and increment usage |
| SSM Parameter Store | Retrieve configuration such as Bedrock Model ID |
| Amazon Bedrock | Generate AI responses |

**Why separate the IAM Roles for the Backend Pod and ALB Controller?**

The permission purposes of these two components are completely different. The AWS Load Balancer Controller needs to manage network resources such as ALBs, Target Groups, and Security Groups. The Backend Pod only needs access to DynamoDB, SSM, and Bedrock for application execution. Separating Roles prevents either side from having excessive permissions and reduces the blast radius when a problem occurs.

---

## 10. Container Image and ECR Design

The Backend is built as a Docker image and stored in Amazon ECR.

| Item | Design |
|---|---|
| Image Name | `koreanmate-dev-backend` |
| Tag | `dev` |
| Build Tool | Docker |
| Registry | Amazon ECR |
| Runtime | Node.js Express |
| Security Scan | Trivy |

The Kubernetes Deployment pulls the Backend image pushed to ECR and runs it as a Pod.

**Why use ECR?**

When operating container images in an AWS environment such as EKS, ECR integrates naturally with IAM-based authentication and AWS resources. GitHub Actions can push images to ECR, and EKS Nodes can pull those images. Keeping the image registry inside AWS also makes it easier to review deployment history through IAM, CloudTrail, and ECR image digests.

**Why include Trivy Scan in the image build pipeline?**

Containers are affected not only by application code, but also by OS packages, Node.js dependencies, and base image vulnerabilities. Including Trivy Scan in GitHub Actions allows image vulnerabilities to be checked before pushing to ECR and provides evidence that security validation is part of the deployment flow.

---

## 11. CI/CD and GitOps Design

<img src="./images/eks-design/cicd-gitops-flow.png" width="1000">

The EKS deployment flow is divided into the Image Build Pipeline and GitOps Sync.

### 11.1 Image Build Pipeline

GitHub Actions builds the Backend Docker image, runs Trivy Scan, and pushes the image to ECR.

```text
Developer
  ↓
GitHub Repository
  ↓
GitHub Actions
  ↓
Docker Build
  ↓
Trivy Scan
  ↓
GitHub OIDC
  ↓
IAM Deploy Role
  ↓
Amazon ECR Push
```

| Step | Role |
|---|---|
| Checkout | Source code checkout |
| Configure AWS Credentials | AWS authentication through GitHub OIDC |
| ECR Login | Amazon ECR authentication |
| Docker Build | Creates the Backend image |
| Trivy Scan | Scans image vulnerabilities |
| Docker Push | Pushes the `dev` tag to ECR |

**Why build and push the image through GitHub Actions?**

If developers push images directly from a local machine, the build environment and deployment history depend on an individual PC. Building in GitHub Actions keeps the image build, scan, and push logs in a single workflow and makes it easier to trace which commit produced which image.

### 11.2 GitOps Sync

Argo CD watches the Kubernetes manifests in the GitHub Repository and keeps the EKS Cluster state aligned with the desired state in Git.

```text
GitHub Repository
  ↓
Argo CD
  ↓
Kubernetes Manifest Sync
  ↓
EKS Backend Deployment
```

| Item | Value |
|---|---|
| Application | `koreanmate-backend` |
| Repository | GitHub Repository |
| Target Revision | `eks` |
| Path | `deploy/k8s/backend` |
| Destination | `in-cluster` |
| Namespace | `koreanmate` |
| Desired Status | `Synced`, `Healthy` |

**Why use GitOps?**

If Kubernetes resources are deployed only with `kubectl apply`, it is difficult to confirm whether the current Cluster state matches Git. With Argo CD, the Git repository becomes the desired state, and any difference between the Cluster and Git can be detected as OutOfSync. The `Synced` and `Healthy` status also makes deployment results easy to verify visually.

---

## 12. Observability Design

EKS observability is built around Prometheus and Grafana.

| Tool | Role |
|---|---|
| Prometheus | Collects Kubernetes metrics |
| Grafana | Visualizes Cluster, Namespace, and Pod metrics |
| kube-state-metrics | Provides metrics for Kubernetes object state |
| node-exporter | Provides Node CPU, memory, and network metrics |
| kubectl logs | Checks Pod-level logs |
| kubectl describe | Checks Events, scheduling, probes, and image pull status |

The main observation targets are as follows.

| Area | What to Check |
|---|---|
| Node | Ready status, CPU/memory usage |
| Namespace | Resource usage in `koreanmate`, `argocd`, `monitoring`, and `kube-system` |
| Backend Pod | CPU, memory, network receive/transmit |
| Prometheus Targets | Target `UP` status |
| Argo CD | Application `Synced`, `Healthy` status |
| Ingress | ALB DNS creation, Target Health |

**Why use Prometheus and Grafana?**

In EKS, looking only at Lambda-style function logs is not enough. It is necessary to check which Node a Pod is running on, how much CPU/memory it uses, and how resources are consumed by namespace. Prometheus is suitable for collecting Kubernetes metrics, and Grafana is suitable for visualizing them as dashboards.

---

## 13. Security Design

The EKS security design is separated into container image security, AWS permissions, Kubernetes resources, and deployment authentication.

| Layer | Design | Purpose |
|---|---|---|
| Image Security | Trivy Image Scan | Checks image vulnerabilities |
| Registry Security | ECR | IAM-based access to the image registry |
| Pod AWS Access | IRSA | Grants AWS permissions at the Pod level |
| Controller AWS Access | ALB Controller IRSA | Separates ALB creation permissions |
| Runtime Separation | Namespace | Isolates application resources |
| ServiceAccount | Backend-dedicated ServiceAccount | Limits the permission scope of Backend Pods |
| CI/CD Auth | GitHub OIDC | Removes long-term AWS Access Keys |
| GitOps | Argo CD | Tracks deployment state based on Git |

In the current design, the Backend Pod does not store AWS Access Keys directly. The Pod uses the IAM Role connected to its ServiceAccount, and the AWS SDK obtains temporary credentials through that role.

**Why not put Access Keys into the Pod?**

If long-term Access Keys are stored in Pod environment variables or Kubernetes Secrets, a leak can lead to credential compromise. Key rotation and deployment updates also have to be managed manually. With IRSA, the Pod uses temporary credentials from AWS STS, avoids long-term key storage, and can limit permissions at the ServiceAccount level.

---

## 14. Cost Control Design

EKS generates cost while the Cluster, Worker Nodes, ALB, EBS volumes, and Monitoring Stack exist. Therefore, in the dev environment, the strategy is to reduce or delete resources after validation and evidence capture are complete.

| Cost Item | Cost Management Strategy |
|---|---|
| EKS Control Plane | Target for destroy after validation |
| Managed NodeGroup | Start with minimum nodes and temporarily scale when needed |
| ALB | Delete after Ingress/API validation |
| Monitoring Stack | Can be deleted after Grafana/Prometheus evidence capture |
| EBS Volume | Check remaining volumes after destroy |
| CloudWatch Logs | Avoid unnecessary long-term log retention |
| NAT Gateway | Minimize or exclude in the dev environment |

The operating principle is as follows.

```text
1. Perform basic Backend validation with the minimum NodeGroup
2. Temporarily scale the NodeGroup only when validating Argo CD and Monitoring
3. After evidence capture and documentation, reduce the NodeGroup or run terraform destroy
4. After destroy, check for remaining ALB, EBS, ECR images, and CloudWatch Log Groups
```

**Why include the cost cleanup strategy in the design document?**

EKS continuously generates cost by design. In a portfolio dev environment, keeping EKS running long-term without a production purpose has low value compared with its cost. Therefore, the design should include the flow of “build → validate → capture → document → reduce/delete” as a cost management strategy from the beginning.

---

## 15. Failure Handling and Runbook Design

Potential EKS issues should be checked by resource layer.

| Failure Scenario | First Check | Second Check |
|---|---|---|
| Pod Pending | `kubectl get pods -n koreanmate` | Check Node capacity and Events |
| CrashLoopBackOff | `kubectl logs` | Check environment variables and application port |
| ImagePullBackOff | `kubectl describe pod` | Check ECR image tag and Node ECR permissions |
| ALB not created | `kubectl describe ingress` | Check ALB Controller logs and IRSA permissions |
| 503 response | Target Group Health | Check Service endpoint and Pod readiness |
| AWS API access failure | Backend logs | Check ServiceAccount annotation and IAM Trust Policy |
| Argo CD OutOfSync | Argo CD UI diff | Compare Git manifest and Cluster state |
| Prometheus Target DOWN | Prometheus Targets | Check ServiceMonitor and Pod labels |

**Why structure the Runbook by resource layer?**

EKS failures usually do not come from a single place. For example, an ALB 503 response can be caused by the ALB itself, missing Service endpoints, failed Pod readiness, or a container port mismatch. Therefore, checking from Client → ALB → Ingress → Service → Pod → AWS Service helps narrow down the root cause.

---

## 16. Limitations and Future Improvements

The current design is based on EKS `dev` environment validation. To expand it to a production-level environment, the following improvements are required.

| Item | Current State | Improvement Direction |
|---|---|---|
| HTTPS | ALB HTTP-based validation | Configure ACM certificate and Ingress HTTPS |
| Domain | Direct ALB DNS usage | Connect Route 53 domain |
| Scaling | One replica | Configure HPA |
| Node Scaling | Manual NodeGroup adjustment | Consider Cluster Autoscaler or Karpenter |
| Secret Management | Deployment env-based | Integrate External Secrets Operator or Secrets Manager |
| Logging | Mainly `kubectl logs` | Consider Loki or CloudWatch Container Insights |
| Release Strategy | Basic Rolling Update | Consider Blue/Green or Canary deployment |
| Network Security | Default Kubernetes networking | Apply NetworkPolicy |
| Cost Cleanup | Manual destroy | Automate cleanup workflow or IaC-based cleanup process |
| Environment | dev-focused | Separate prod environment |

**Why separate the improvement items?**

The current scope is a dev environment for validating the EKS operating model. Including HTTPS, HPA, Karpenter, Loki, and Canary deployment all at once would make the scope too large. Therefore, this design first validates the core operational flow, while production-level enhancements are separated into Future Improvements.
