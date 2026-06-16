# KoreanMate EKS Evidence

> Purpose: This document provides evidence that the KoreanMate EKS version successfully validated Kubernetes-based deployment, GitHub Actions image build automation, ECR image push, ALB Ingress, IRSA, Argo CD GitOps, and Prometheus/Grafana observability.
>
> Target environment: AWS Seoul Region `ap-northeast-2`, EKS `dev` environment, Terraform-based IaC

---

## 1. EKS Cluster / NodeGroup Verification

After creating the EKS cluster and Managed NodeGroup with Terraform, I verified whether the worker nodes had successfully joined the EKS cluster by running the following command:

```bash
kubectl get nodes
```

The result showed that the worker nodes were in the `Ready` state.

<img src="./images/evidence/eks-nodegroup-scaled-to-3.png" width="800">

---

## 2. ECR Backend Image Push Verification

I built the backend container image with Docker and pushed it to Amazon ECR with the `dev` tag.

```bash
aws ecr describe-images \
  --repository-name koreanmate-dev-backend \
  --region ap-northeast-2 \
  --image-ids imageTag=dev
```

The result confirmed that the `koreanmate-dev-backend:dev` image was successfully uploaded to ECR and that an image digest was generated.

<img src="./images/evidence/02-ecr-image-push-success.png" width="800">

---

## 3. GitHub Actions EKS Image Build Verification

I configured GitHub Actions to automatically run the backend Docker image build, Trivy scan, and ECR push process.

Workflow:

```text
EKS Backend Image Build
```

The workflow completed successfully, and all checks for the backend image build and push job passed.

<img src="./images/evidence/03-github-actions-eks-image-build-success.png" width="800">

---

## 4. Trivy Image Scan Verification

Trivy was used inside the GitHub Actions workflow to scan the backend Docker image for vulnerabilities.

Scan target:

```text
koreanmate-dev-backend:dev
```

The scan result was recorded in the GitHub Actions logs and is used as evidence that the container image was checked for HIGH and CRITICAL vulnerabilities before being pushed.

<img src="./images/evidence/04-trivy-scan-result.png" width="800">

---

## 5. AWS Load Balancer Controller Verification

I installed the AWS Load Balancer Controller in the EKS cluster and verified that the controller pods were running in the `kube-system` namespace.

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

The result showed that both AWS Load Balancer Controller pods were in the `Running` state.

<img src="./images/evidence/05-alb-controller-running.png" width="800">

---

## 6. AWS Load Balancer Controller IRSA Verification

I connected an IAM Role to the AWS Load Balancer Controller ServiceAccount so that the controller could manage AWS resources.

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

The result confirmed that the IAM Role ARN annotation was correctly attached to the ServiceAccount.

```text
eks.amazonaws.com/role-arn: arn:aws:iam::127696278675:role/koreanmate-dev-eks-cluster-aws-load-balancer-controller-role
```

<img src="./images/evidence/06-alb-controller-irsa.png" width="800">

---

## 7. Backend Pod IRSA Role Verification

I configured a dedicated IAM Role for the backend pod so it could access DynamoDB, SSM Parameter Store, and Amazon Bedrock.

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-backend-pod-role
```

The result confirmed that the IAM Role trust policy was restricted to the `system:serviceaccount:koreanmate:backend` ServiceAccount for `AssumeRoleWithWebIdentity`.

```text
system:serviceaccount:koreanmate:backend
```

<img src="./images/evidence/07-backend-pod-irsa-role.png" width="800">

---

## 8. Backend Pod Deployment Verification

The backend pod was deployed to EKS using a Kubernetes Deployment.

```bash
kubectl get pods -n koreanmate
```

The result confirmed that the backend pod was running successfully.

<img src="./images/evidence/08-backend-pod-running.png" width="800">

---

## 9. Backend Service Internal Communication Verification

I used port-forwarding to call the `/health` endpoint and verify that the Kubernetes Service correctly routed traffic to the backend pod.

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
```

```bash
curl http://localhost:8081/health
```

Response:

<img src="./images/evidence/backend-service-health-success.png" width="800">

---

## 10. ALB Ingress External Access Verification

The AWS Load Balancer Controller created an ALB based on the Ingress resource. I verified external access to the backend `/health` endpoint through the ALB DNS name.

```bash
kubectl get ingress -n koreanmate
```

```bash
curl http://<ALB_DNS_NAME>/health
```

Response:

<img src="./images/evidence/10-alb-ingress-success.png" width="800">

<img src="./images/evidence/10-alb-health-success.png" width="800">

---

## 11. Backend API Call Verification

I called the main backend APIs through the ALB endpoint to confirm that the EKS environment could process application requests correctly.

Verified APIs:

```text
POST /correction
POST /conversation
POST /level-test
```

All three APIs returned successful responses through the ALB Ingress.

<img src="./images/evidence/11-api-correction-success.png" width="800">

<img src="./images/evidence/11-api-conversation-success.png" width="800">

<img src="./images/evidence/11-api-level-test-success.png" width="800">

---

## 12. Argo CD Installation Verification

After installing Argo CD in the EKS cluster, I verified that all Argo CD components were running.

```bash
kubectl get pods -n argocd
```

The result showed that the Argo CD Application Controller, Repo Server, Redis, Dex Server, and Argo CD Server were all running successfully.

<img src="./images/evidence/12-argocd-pods-running.png" width="800">

---

## 13. Argo CD Application Synced / Healthy Verification

I created an Argo CD Application to watch the Kubernetes manifests in the GitHub repository.

Application configuration:

```text
Application: koreanmate-backend
Repository: https://github.com/elkim-ea/Portfolio_2nd.git
Target Revision: eks
Path: deploy/k8s/backend
Destination: in-cluster
Namespace: koreanmate
```

The Argo CD UI confirmed that the `koreanmate-backend` Application was in the `Synced` and `Healthy` states.

<img src="./images/evidence/argocd-application-synced-healthy.png" width="800">

---

## 14. Monitoring Stack Pod Verification

After installing Prometheus, Grafana, Alertmanager, kube-state-metrics, and node-exporter, I verified the pod status in the `monitoring` namespace.

```bash
kubectl get pods -n monitoring
```

The result showed that all monitoring components were running successfully.

<img src="./images/evidence/monitoring-pods-running.png" width="800">

---

## 15. Prometheus Targets UP Verification

I checked the Prometheus Targets page to verify that scrape targets were being collected correctly.

Access method:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

```text
http://localhost:9090/targets
```

The result showed that the Grafana and Alertmanager targets were in the `UP` state.

<img src="./images/evidence/15-prometheus-targets-up.png" width="800">

---

## 16. Grafana Cluster Dashboard Verification

I used the Grafana Kubernetes dashboard to check cluster-wide CPU, memory, and namespace-level resource usage for the EKS cluster.

Access method:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

```text
http://localhost:3002
```

The dashboard displayed CPU and memory usage for the `argocd`, `monitoring`, `kube-system`, and `koreanmate` namespaces.

<img src="./images/evidence/16-grafana-cluster-dashboard1.png" width="800">

<img src="./images/evidence/16-grafana-cluster-dashboard2.png" width="800">

---

## 17. Grafana KoreanMate Backend Pod Metrics Verification

In Grafana's Kubernetes Namespace (Pods) dashboard, I selected the `koreanmate` namespace and checked CPU, memory, and network metrics for the backend pod.

Target:

```text
Namespace: koreanmate
Pod: backend-*
```

The dashboard displayed CPU usage, memory usage, and network receive/transmit metrics for the KoreanMate backend pod.

<img src="./images/evidence/17-grafana-backend-pod-metrics1.png" width="800">

<img src="./images/evidence/17-grafana-backend-pod-metrics2.png" width="800">

<img src="./images/evidence/17-grafana-backend-pod-metrics3.png" width="800">

---

## 18. EKS Cost Cleanup Verification

After completing the EKS validation and documentation, I deleted the EKS-related resources to avoid ongoing costs.

EKS can continue to generate costs while the cluster exists. Additional cost sources can include worker nodes, ALB, EBS volumes, NAT Gateway, ECR images, and CloudWatch Logs. Therefore, this EKS version was not designed as an always-on production environment. Instead, it was used to validate Kubernetes operations, capture evidence, document the result, and then clean up the resources.

Before deletion, I first deleted the Kubernetes Ingress so that the AWS Load Balancer Controller could remove the ALB. After that, I cleaned up the backend namespace, Argo CD, and the monitoring stack, then ran Terraform destroy.

After cleanup, I verified the following resources using the AWS CLI.

---

### 18.1 EKS Cluster Deletion Verification

```bash
aws eks list-clusters --region ap-northeast-2
```

The result confirmed that no EKS cluster remained.

```json
{
  "clusters": []
}
```

---

### 18.2 Application Load Balancer Deletion Verification

```bash
aws elbv2 describe-load-balancers \
  --region ap-northeast-2
```

The result confirmed that no Application Load Balancer created by the EKS Ingress remained.

```json
{
  "LoadBalancers": []
}
```

---

### 18.3 EBS Volume Cleanup Verification

```bash
aws ec2 describe-volumes \
  --region ap-northeast-2 \
  --filters Name=status,Values=available
```

The result confirmed that there were no remaining EBS volumes in the `available` state after deletion.

```json
{
  "Volumes": []
}
```

---

### 18.4 NAT Gateway Cleanup Verification

```bash
aws ec2 describe-nat-gateways \
  --region ap-northeast-2 \
  --filter Name=state,Values=available,pending
```

The result confirmed that there were no NAT Gateways in the `available` or `pending` state.

```json
{
  "NatGateways": []
}
```

<img src="./images/evidence/20-all-cleanup.png" width="800">

---

### 18.5 ECR Repository Deletion Verification

```bash
aws ecr describe-repositories \
  --region ap-northeast-2
```

The result confirmed that the ECR repository used for the EKS backend image had been deleted.

```json
{
  "repositories": []
}
```

<img src="./images/evidence/20-ecr-repository-deleted.png" width="800">

---

### 18.6 CloudWatch EKS Log Group Deletion Verification

In Git Bash, the `/aws/eks` path can be automatically converted into a Windows path. Therefore, I used `MSYS_NO_PATHCONV=1` to prevent path conversion.

```bash
MSYS_NO_PATHCONV=1 aws logs describe-log-groups \
  --region ap-northeast-2 \
  --log-group-name-prefix /aws/eks
```

The result confirmed that no EKS-related CloudWatch Log Groups remained.

```json
{
  "logGroups": []
}
```

<img src="./images/evidence/20-cloudwatch-eks-loggroup-cleanup.png" width="800">

---

## 19. Evidence Summary

The EKS version validated the following areas:

| Area | Validation |
|---|---|
| EKS Cluster | Verified worker nodes in the `Ready` state |
| ECR | Verified backend Docker image push |
| CI/CD | Verified GitHub Actions image build and push |
| Security | Verified Trivy image scan |
| IAM | Verified ALB Controller IRSA |
| IAM | Verified Backend Pod IRSA |
| Kubernetes | Verified Backend Deployment and Service |
| Ingress | Verified external access through ALB Ingress |
| API | Verified successful calls to `/correction`, `/conversation`, and `/level-test` |
| GitOps | Verified Argo CD `Synced` and `Healthy` states |
| Monitoring | Verified Prometheus Targets `UP` state |
| Monitoring | Verified Grafana backend pod metrics |
| Cost Control | Verified deletion of EKS Cluster, ALB, EBS, NAT Gateway, ECR, and CloudWatch Logs |

This validation confirmed that the KoreanMate backend can run as a containerized application on EKS, process external requests through ALB Ingress, and access AWS managed services through IRSA.

It also confirmed the supporting operational workflow: GitHub Actions for image build automation, ECR for image storage, Trivy for image security scanning, Argo CD for GitOps deployment, and Prometheus/Grafana for Kubernetes observability.

After validation and documentation were completed, I deleted the EKS-related resources to reduce ongoing costs and verified through the AWS CLI that no major residual resources remained.
