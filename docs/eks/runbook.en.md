# KoreanMate EKS Runbook

> Purpose: This runbook defines the investigation order, root cause analysis approach, temporary mitigation steps, and recovery procedures for common operational issues in the KoreanMate EKS version.  
> Target environment: AWS Seoul Region `ap-northeast-2`, EKS `dev` environment, Terraform-based Kubernetes architecture

---

## 1. Runbook Overview

The KoreanMate EKS version is not a replacement for the Serverless version. It is an extension designed to validate Kubernetes operational capability.

The backend application is built as a Docker image, stored in Amazon ECR, and deployed as a Backend Pod inside the EKS Cluster. External requests are routed through the ALB Ingress created by AWS Load Balancer Controller, then forwarded to the Kubernetes Service and Backend Pod.

When an operational issue occurs, check the system in the following order.

```text
User / API Client
  ↓
ALB Ingress
  ↓
Kubernetes Service
  ↓
Backend Pod
  ↓
IRSA
  ↓
DynamoDB / SSM Parameter Store / Bedrock
  ↓
Prometheus / Grafana / Argo CD
```

The basic incident response principles are as follows.

| Principle | Description |
|---|---|
| Identify the impact scope | First determine whether the issue is related to ALB, Kubernetes Service, or the Backend Pod. |
| Check recent changes | Review recent GitHub Actions runs, Docker image pushes, Argo CD syncs, and Terraform applies. |
| Check Kubernetes status first | Start with `kubectl get`, then `kubectl describe`, then `kubectl logs`. |
| Use logs and events as evidence | Avoid assumptions. Use Pod logs, Kubernetes Events, Argo CD status, and Prometheus/Grafana metrics. |
| Consider cost management | EKS continuously generates cost, so scale down the NodeGroup or destroy the environment after validation. |
| Record prevention notes | Document the cause, fix, and lessons learned in `troubleshooting.md`. |

---

## 2. Main Operational Tools

| Tool | Purpose |
|---|---|
| kubectl | Check EKS Cluster, Pod, Service, and Ingress status |
| Terraform | Manage EKS, VPC, NodeGroup, IAM, and IRSA resources |
| GitHub Actions | Build backend Docker image, run Trivy scan, and push to ECR |
| Amazon ECR | Store the backend Docker image |
| AWS Load Balancer Controller | Create an ALB from Kubernetes Ingress resources |
| Argo CD | Synchronise Kubernetes manifests using GitOps |
| Prometheus | Collect Kubernetes metrics |
| Grafana | Visualise cluster, namespace, and pod metrics |
| AWS IAM / IRSA | Control AWS access at the Pod level |
| AWS CLI | Inspect AWS resources such as EKS, IAM, ECR, and ALB |

---

## 3. Common Incident Investigation Procedure

When an issue occurs, follow the order below.

### 3.1 Check the User Symptom

| Symptom | Possible Cause |
|---|---|
| ALB address is not reachable | Ingress, ALB, or controller issue |
| `/health` fails | Backend Pod, Service, or Ingress issue |
| API returns 500 | Backend code, environment variable, AWS permission, or Bedrock issue |
| Pod is Pending | Insufficient node resources or Pod capacity |
| Pod is CrashLoopBackOff | Missing environment variable or application startup failure |
| Argo CD is OutOfSync | Git manifest and cluster state do not match |
| Grafana metrics are missing | Prometheus target, ServiceMonitor, or Pod metrics issue |

### 3.2 Check Recent Changes

Check recent Git changes:

```bash
git log --oneline -5
```

Check GitHub Actions:

```text
GitHub Repository
→ Actions
→ EKS Backend Image Build
→ Check the latest failed job
```

Check Argo CD sync status:

```text
Argo CD UI
→ koreanmate-backend
→ Check Sync Status / Health Status
```

Check Terraform drift or pending changes:

```bash
cd infra/eks/envs/dev
terraform plan
```

### 3.3 Check Basic EKS Status

```bash
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name koreanmate-dev-eks-cluster
```

```bash
kubectl get nodes
kubectl get pods -A
```

---

## 4. EKS Cluster / Node Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Node is not Ready | NodeGroup issue or kubelet issue |
| Pod is Pending | Insufficient CPU, memory, or Pod capacity |
| Argo CD / Monitoring Pods do not start | Pod count limit on small nodes such as `t3.small` |
| Node count is different from expected | Terraform NodeGroup setting mismatch |

### Investigation Steps

Check Node status:

```bash
kubectl get nodes
```

Check Node details:

```bash
kubectl describe nodes
```

Important fields to check:

```text
Ready
MemoryPressure
DiskPressure
PIDPressure
Allocatable pods
Non-terminated Pods
```

Check Terraform NodeGroup settings:

```bash
cd infra/eks/envs/dev
terraform plan
```

### Response

If the issue is caused by insufficient Pod capacity, temporarily scale the NodeGroup.

Example for Argo CD validation:

```hcl
node_desired_size = 2
node_min_size     = 1
node_max_size     = 2
```

Example for Prometheus / Grafana validation:

```hcl
node_desired_size = 3
node_min_size     = 1
node_max_size     = 3
```

Apply the change:

```bash
cd infra/eks/envs/dev
terraform plan
terraform apply
```

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Node is Ready | `kubectl get nodes` |
| Pending Pods decrease | `kubectl get pods -A` |
| Argo CD is healthy | `kubectl get pods -n argocd` |
| Monitoring stack is healthy | `kubectl get pods -n monitoring` |

---

## 5. Backend Pod Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Pod is CrashLoopBackOff | Missing environment variable or application startup failure |
| Pod is ImagePullBackOff | Wrong ECR image tag or ECR permission issue |
| Pod is Pending | Insufficient node resources or Pod capacity |
| ZodError appears in logs | Required environment variable is missing |
| AWS call fails | IRSA permission issue |

### Investigation Steps

Check Backend Pod status:

```bash
kubectl get pods -n koreanmate
```

Check Pod details:

```bash
kubectl describe pod -n koreanmate <backend-pod-name>
```

Check Backend logs:

```bash
kubectl logs -n koreanmate deployment/backend
```

Check only recent logs:

```bash
kubectl logs -n koreanmate deployment/backend --tail=100
```

Check Deployment environment variables:

```bash
kubectl describe deployment backend -n koreanmate
```

### Response

If an environment variable is missing, check the `env` section in `deploy/k8s/backend/deployment.yaml`.

Required environment variables include:

```text
NODE_ENV
PORT
AWS_REGION
BEDROCK_MODEL_ID
LEARNING_RECORDS_TABLE_NAME
USAGE_LIMITS_TABLE_NAME
USER_PROFILES_TABLE_NAME
BEDROCK_MODEL_ID_PARAMETER_NAME
```

Apply the manifest after modification:

```bash
kubectl apply -f deploy/k8s/backend/
kubectl rollout status deployment/backend -n koreanmate
```

Restart the Deployment if needed:

```bash
kubectl rollout restart deployment/backend -n koreanmate
```

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Backend Pod is Running | `kubectl get pods -n koreanmate` |
| Server startup log is visible | `kubectl logs` |
| Service health check succeeds | `curl http://localhost:8081/health` |
| ALB health check succeeds | `curl http://<ALB_DNS_NAME>/health` |

---

## 6. Backend Service / Internal Network Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Pod is Running, but `/health` fails | Service selector issue |
| port-forward fails | Service or Pod endpoint issue |
| Service endpoint is empty | Pod labels and Service selector do not match |
| ALB exists, but target is unhealthy | Service `targetPort` issue |

### Investigation Steps

Check Service:

```bash
kubectl get service -n koreanmate
```

Check Service details:

```bash
kubectl describe service backend -n koreanmate
```

Check Endpoints:

```bash
kubectl get endpoints -n koreanmate
```

Run internal health check:

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
```

Check from another terminal:

```bash
curl http://localhost:8081/health
```

### Response

1. Check whether the Service selector matches the Deployment labels.
2. Check whether the Service `targetPort` matches the Backend container port.
3. Check whether the Backend Pod is in `Running` state.
4. If the Endpoint is empty, fix the Service selector.

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Service exists | `kubectl get svc -n koreanmate` |
| Endpoint exists | `kubectl get endpoints -n koreanmate` |
| Internal health check succeeds | `curl http://localhost:8081/health` |

---

## 7. ALB Ingress Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Ingress ADDRESS is empty | AWS Load Balancer Controller issue |
| ALB DNS is not reachable | ALB creation failure or security group issue |
| `/health` returns 503 | Target Group is unhealthy |
| Ingress event error appears | Annotation, subnet, or IAM permission issue |

### Investigation Steps

Check Ingress:

```bash
kubectl get ingress -n koreanmate
```

Check Ingress details:

```bash
kubectl describe ingress backend -n koreanmate
```

Check AWS Load Balancer Controller:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

Check Controller logs:

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

Run ALB health check:

```bash
curl http://<ALB_DNS_NAME>/health
```

### Response

1. Check whether the AWS Load Balancer Controller Pod is Running.
2. Check the IRSA annotation on the Controller ServiceAccount.
3. Check the Ingress annotations.
4. Check whether the Service endpoint exists.
5. Check Target Group health in the AWS Console.

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Ingress ADDRESS is created | `kubectl get ingress -n koreanmate` |
| ALB Controller is Running | `kubectl get pods -n kube-system` |
| ALB health check succeeds | `curl http://<ALB_DNS_NAME>/health` |

---

## 8. IRSA / AWS Permission Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Backend cannot access DynamoDB | Backend Pod IRSA permission is insufficient |
| Bedrock call fails | Missing `bedrock:InvokeModel` permission |
| SSM Parameter lookup fails | Missing `ssm:GetParameter` permission |
| ALB is not created | AWS Load Balancer Controller IRSA issue |
| AccessDenied occurs | IAM Policy or Trust Policy issue |

### Investigation Steps

Check Backend ServiceAccount:

```bash
kubectl describe serviceaccount backend -n koreanmate
```

Check AWS Load Balancer Controller ServiceAccount:

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

Check Backend Pod IAM Role:

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-backend-pod-role
```

Check ALB Controller IAM Role:

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-aws-load-balancer-controller-role
```

### Response

1. Check whether the ServiceAccount has the `eks.amazonaws.com/role-arn` annotation.
2. Check whether the IAM Role Trust Policy is connected to the OIDC provider.
3. Check whether the Trust Policy subject points to the correct ServiceAccount.
4. Check whether the IAM Policy contains the required AWS API permissions.

Expected Backend Pod Trust Policy subject:

```text
system:serviceaccount:koreanmate:backend
```

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| ServiceAccount annotation exists | `kubectl describe serviceaccount` |
| Trust Policy subject matches | `aws iam get-role` |
| Backend API responds normally | ALB API call |
| ALB is automatically created | `kubectl get ingress` |

---

## 9. Backend API 500 Issues

### Symptoms

A 500 response is returned when calling the API through the ALB address.

Target APIs:

```text
POST /correction
POST /conversation
POST /level-test
```

### Main Causes

| Cause | Description |
|---|---|
| Missing environment variable | Missing table name, model ID, or similar configuration |
| Insufficient IRSA permission | DynamoDB, SSM, or Bedrock access failure |
| Bedrock call failure | Model ID, region, or permission issue |
| DynamoDB write failure | Table name, key schema, or IAM issue |
| Backend code error | Runtime exception inside the container |

### Investigation Steps

Check Backend logs:

```bash
kubectl logs -n koreanmate deployment/backend --tail=100
```

Check Pod status:

```bash
kubectl get pods -n koreanmate
```

Check environment variables:

```bash
kubectl describe deployment backend -n koreanmate
```

Call ALB API:

```bash
curl -X POST http://<ALB_DNS_NAME>/correction \
  -H "Content-Type: application/json" \
  -d '{
    "text": "나는 어제 학교에 가요.",
    "level": "a2"
  }'
```

### Response

1. Check the actual error message in the logs.
2. If an environment variable is missing, update the Deployment manifest.
3. If the error is `AccessDenied`, check the Backend Pod IRSA Role permissions.
4. If the error is related to Bedrock, check the model ID and region.
5. If the error is related to DynamoDB, check the table name and key schema.

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| API returns HTTP 200 | curl test |
| No Backend error logs | `kubectl logs` |
| DynamoDB write succeeds | Check DynamoDB table |
| Bedrock result is returned | Check API response body |

---

## 10. Argo CD Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Argo CD Pod is Pending | Insufficient Node Pod capacity |
| Repo Server Error | Missing Secret or ConfigMap |
| Application is OutOfSync | Git manifest and cluster state do not match |
| Application is Degraded | Pod, Service, or Ingress issue |
| UI is not reachable | port-forward stopped or `argocd-server` issue |

### Investigation Steps

Check Argo CD Pod status:

```bash
kubectl get pods -n argocd
```

Check Application:

```bash
kubectl get applications -n argocd
```

Check Application details:

```bash
kubectl describe application koreanmate-backend -n argocd
```

Access Argo CD UI:

```bash
kubectl port-forward svc/argocd-server -n argocd 8082:443
```

Browser URL:

```text
https://localhost:8082
```

### Response

1. Check whether Argo CD Pods are Running.
2. If `CreateContainerConfigError` occurs, check for missing Secret or ConfigMap.
3. If Pods are `Pending`, check Node capacity.
4. If the Application is OutOfSync, check the GitHub branch, path, and manifest changes.
5. If needed, manually run Sync in the Argo CD UI.

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Argo CD Pod is Running | `kubectl get pods -n argocd` |
| Application is Synced | Argo CD UI |
| Application is Healthy | Argo CD UI |
| Backend Pod is normal | `kubectl get pods -n koreanmate` |

---

## 11. Prometheus / Grafana Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Prometheus is Pending | Insufficient node resources or Pod capacity |
| Grafana is not reachable | port-forward stopped |
| Targets are DOWN | Prometheus scrape failure |
| Backend metrics are missing | Wrong Namespace/Pod selection or metrics collection issue |
| Dashboard has no data | Prometheus datasource issue |

### Investigation Steps

Check Monitoring Pod status:

```bash
kubectl get pods -n monitoring
```

Access Prometheus Targets:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

Browser URL:

```text
http://localhost:9090/targets
```

Access Grafana:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

Browser URL:

```text
http://localhost:3002
```

Check Grafana password:

```bash
kubectl get secret -n monitoring monitoring-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

### Response

1. Check whether all Monitoring Pods are Running.
2. If Prometheus Server is Pending, inspect Events with `kubectl describe pod`.
3. If the issue is insufficient Node resources or Pod capacity, temporarily scale the NodeGroup.
4. If Grafana is not reachable, check whether port-forward is still running.
5. Check whether scrape targets are `UP` in Prometheus Targets.

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| Monitoring Pods are Running | `kubectl get pods -n monitoring` |
| Prometheus Targets are UP | `/targets` page |
| Grafana is reachable | `http://localhost:3002` |
| Backend metrics are visible | Kubernetes Namespace(Pods) Dashboard |

---

## 12. GitHub Actions / ECR Issues

### Symptoms

| Symptom | Possible Cause |
|---|---|
| Image build fails | Dockerfile or TypeScript build issue |
| Trivy scan fails | Image vulnerability or scan configuration issue |
| ECR push fails | GitHub OIDC, IAM permission, or ECR login issue |
| EKS still uses the previous image | Image tag unchanged or image pull policy issue |

### Investigation Steps

Check GitHub Actions:

```text
GitHub Repository
→ Actions
→ EKS Backend Image Build
→ Check the failed step logs
```

Check ECR image:

```bash
aws ecr describe-images \
  --repository-name koreanmate-dev-backend \
  --region ap-northeast-2 \
  --image-ids imageTag=dev
```

Check current Deployment image:

```bash
kubectl get deployment backend -n koreanmate \
  -o jsonpath="{.spec.template.spec.containers[0].image}"
```

### Response

1. Check the failed GitHub Actions step.
2. If Docker build fails, reproduce the same build locally.
3. If ECR push fails, check the ECR permissions on the GitHub OIDC Role.
4. If the image has been updated but the Pod still uses the old one, restart the rollout.

```bash
kubectl rollout restart deployment/backend -n koreanmate
```

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| GitHub Actions succeeds | Actions page |
| ECR image digest exists | `aws ecr describe-images` |
| Backend Pod is Running | `kubectl get pods -n koreanmate` |
| API responds normally | curl test |

---

## 13. Cost Increase Response

### Symptoms

AWS cost increases faster than expected after EKS validation.

### Main Causes

| Cause | Description |
|---|---|
| EKS Control Plane | Cost is generated while the cluster exists |
| Worker Node | EC2 NodeGroup cost is generated |
| ALB | ALB created by Ingress generates cost |
| EBS Volume | Node or monitoring-related volumes may remain |
| CloudWatch Logs | Log storage cost |
| Prometheus / Grafana | Pod resource usage may require node scaling |
| NAT Gateway | If used, it continuously generates cost |

### Investigation Steps

Check current Nodes:

```bash
kubectl get nodes
```

Check all Pods:

```bash
kubectl get pods -A
```

Check Terraform resources:

```bash
cd infra/eks/envs/dev
terraform state list
```

Check AWS Cost Explorer:

```text
AWS Console
→ Billing and Cost Management
→ Cost Explorer
→ Check cost by service
```

### Response

After validation is complete, delete Helm-managed resources first.

```bash
helm uninstall monitoring -n monitoring
```

Delete Argo CD:

```bash
kubectl delete namespace argocd
```

Delete monitoring namespace:

```bash
kubectl delete namespace monitoring
```

Delete Backend application:

```bash
kubectl delete -f deploy/k8s/backend/
```

Destroy the EKS environment:

```bash
cd infra/eks/envs/dev
terraform destroy
```

### Recovery Criteria

| Criterion | How to Verify |
|---|---|
| EKS Cluster is deleted | `aws eks list-clusters` |
| ALB is deleted | `aws elbv2 describe-load-balancers` |
| No unnecessary EBS volume remains | `aws ec2 describe-volumes` |
| Cost increase stops | Cost Explorer |

---

## 14. Emergency Recovery Checklist

When an issue occurs, quickly check the following items.

```text
[ ] Confirm kubectl context is koreanmate-dev-eks-cluster
[ ] Confirm EKS Node is Ready
[ ] Confirm Backend Pod is Running
[ ] Check Backend Pod logs for errors
[ ] Confirm Service endpoint exists
[ ] Confirm Ingress has an ALB DNS address
[ ] Check ALB /health response
[ ] Check AWS Load Balancer Controller status
[ ] Check Backend ServiceAccount IRSA annotation
[ ] Confirm Argo CD Application is Synced / Healthy
[ ] Confirm Prometheus Targets are UP
[ ] Confirm Grafana shows backend Pod metrics
[ ] Check recent GitHub Actions Image Build failure
```
