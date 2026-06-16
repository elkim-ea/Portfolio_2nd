# KoreanMate EKS - Troubleshooting Notes

> Documentation structure: Problem → Attempts → Comparison → Lessons Learned  
> Environment: AWS Seoul Region `ap-northeast-2`, EKS `dev` environment, Terraform-based IaC

---

# 1. Missing `BEDROCK_MODEL_ID` Environment Variable During Backend Pod Startup

## Problem

After deploying the Backend Deployment to EKS, the container did not start correctly and a `ZodError` appeared in the Pod logs.

```bash
kubectl logs -n koreanmate deployment/backend
```

The representative error was:

```text
ZodError: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "BEDROCK_MODEL_ID"
    ],
    "message": "Invalid input: expected string, received undefined"
  }
]
```

I did not capture the original error screen at the time, so I recorded the actual error message as text.

The root cause was that the Kubernetes Deployment manifest did not define the `BEDROCK_MODEL_ID` environment variable.

In local Docker execution, the backend used a `.env` file. However, an EKS Pod does not automatically receive values from a local `.env` file. Runtime environment variables required by the container must be explicitly defined in `deployment.yaml` or injected through a ConfigMap or Secret.

---

## Attempts

### Attempt 1. Check the Pod logs

I first checked the Backend Pod logs to understand why the container was not starting correctly.

```bash
kubectl logs -n koreanmate deployment/backend
```

The logs showed that the issue was not an AWS permission problem or an image pull failure. It was an application startup failure caused by missing environment variable validation.

### Attempt 2. Check the `env` section in the Deployment manifest

I reviewed the `env` section in `deploy/k8s/backend/deployment.yaml`.

At that point, the manifest included the following values:

```text
NODE_ENV
PORT
AWS_REGION
LEARNING_RECORDS_TABLE_NAME
USAGE_LIMITS_TABLE_NAME
USER_PROFILES_TABLE_NAME
BEDROCK_MODEL_ID_PARAMETER_NAME
```

However, the application also required `BEDROCK_MODEL_ID`, and that value was missing.

### Attempt 3. Add the `BEDROCK_MODEL_ID` environment variable

I explicitly added the Bedrock model ID to `deployment.yaml`.

```yaml
- name: BEDROCK_MODEL_ID
  value: "anthropic.claude-3-haiku-20240307-v1:0"
```

After updating the manifest, I applied the Deployment again.

```bash
kubectl apply -f deploy/k8s/backend/deployment.yaml
kubectl rollout status deployment/backend -n koreanmate
```

### Attempt 4. Verify the Service health check

After the Pod started correctly, I tested the `/health` endpoint through the Kubernetes Service.

<img src="./images/troubleshooting/backend-service-health-success.png" width="800">

---

## Comparison

| Item | Before Fix | After Fix |
|---|---|---|
| Environment variable management | Relied on local `.env` | Explicitly defined in Kubernetes Deployment env |
| Pod status | Container startup failed | Running |
| Logs | `BEDROCK_MODEL_ID` undefined | Server running |
| Service health check | Not available | `/health` returned successfully |
| Operational explanation | Local and EKS runtime difference was unclear | Runtime environment variable management became explicit |

---

## Lessons Learned

Local Docker execution and Kubernetes Pod execution use different environment variable injection mechanisms.

```text
Local Docker
→ Can use --env-file or .env

Kubernetes
→ Requires explicit injection through Deployment env, ConfigMap, or Secret
```

When a container fails to start or enters `CrashLoopBackOff`, the following check order is effective:

```text
1. kubectl get pods
2. kubectl logs
3. kubectl describe pod
4. Check Deployment env / command / image configuration
```

This issue was not caused by Kubernetes itself. It happened because a required application environment variable was not reflected in the Deployment manifest.

---

# 2. GitHub Actions OIDC / ECR Permission Issue

## Problem

While configuring a workflow to build the EKS Backend Docker image in GitHub Actions and push it to Amazon ECR, two separate permission issues occurred.

The first issue was that GitHub Actions could not assume the AWS IAM Role through OIDC.

The error occurred in the `Configure AWS credentials` step.

<img src="./images/troubleshooting/github-actions-oidc-assume-role-failed.png" width="800">

The second issue occurred after the OIDC role assumption succeeded. The workflow then failed during the ECR login step because the assumed role did not have enough ECR permissions.

The error occurred in the `Login to Amazon ECR` step.

<img src="./images/troubleshooting/github-actions-ecr-login-permission-denied.png" width="800">

---

## Root Cause

### Cause 1. GitHub OIDC Trust Policy condition mismatch

For GitHub Actions to assume an AWS IAM Role through OIDC, the IAM Role Trust Policy must allow the correct GitHub repository and branch conditions.

The EKS work was being performed on the `eks` branch. If the Trust Policy only allowed the `main` branch, the following error could occur:

```text
Not authorized to perform sts:AssumeRoleWithWebIdentity
```

The core issue was not the workflow logic itself. The IAM Role Trust Policy condition did not match the branch where the workflow was running.

### Cause 2. Missing IAM permissions required for ECR push

Even after OIDC role assumption succeeds, the role still needs service-level permissions to perform ECR operations.

The `aws-actions/amazon-ecr-login` action needs permission to retrieve an ECR authorization token:

```text
ecr:GetAuthorizationToken
```

Pushing a Docker image also requires permissions such as:

```text
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
```

---

## Attempts

### Attempt 1. Check the GitHub Checks result

Before fixing the permissions, some PR checks were failing.

<img src="./images/troubleshooting/github-pr-checks-failed.png" width="800">

I then updated the configuration so that the EKS Backend Image Build workflow could run correctly.

### Attempt 2. Check the GitHub Actions logs

I first checked which workflow step failed.

```text
Configure AWS credentials
```

Because the failure occurred at the AWS credential configuration step, I concluded that this was an AWS authentication issue rather than a Docker build or ECR push issue.

### Attempt 3. Check the IAM Role Trust Policy

I reviewed the Trust Policy of the IAM Role used by GitHub Actions.

The review criteria were:

```text
1. Is the GitHub OIDC Provider configured?
2. Does the repository condition match the current repository?
3. Does the branch condition match the current working branch?
4. Is sts:AssumeRoleWithWebIdentity allowed?
```

Since the EKS work was being performed on the `eks` branch, I updated the Trust Policy to allow the `eks` branch.

### Attempt 4. Re-run the OIDC authentication workflow

After fixing the Trust Policy, I re-ran the GitHub Actions workflow.

The `Configure AWS credentials` step passed, but a new permission error occurred in the next step, `Login to Amazon ECR`.

```text
not authorized to perform: ecr:GetAuthorizationToken
```

At this point, I separated the two issues:

```text
1. The first issue was failure to assume the IAM Role.
2. The second issue was missing ECR permissions on the assumed IAM Role.
```

### Attempt 5. Add ECR permissions to the GitHub Actions role

I added the ECR permissions required for login and image push to the GitHub Actions IAM Role.

Required permissions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
```

After updating the permissions, I re-ran the workflow.

---

## Comparison

| Item | Before Fix | After Fix |
|---|---|---|
| OIDC Role Assume | Failed | Successful |
| AWS authentication method | IAM Role could not be assumed | Temporary credentials issued through GitHub OIDC |
| ECR Login | Missing `ecr:GetAuthorizationToken` permission | ECR Login succeeded |
| Docker image push | Not possible | ECR Push succeeded |
| Deployment security | Risk of falling back to long-term access keys | OIDC-based temporary credentials used |
| CI/CD traceability | Failed job visible in PR checks | Failure could be traced by job → step → IAM cause |

---

## Lessons Learned

When using AWS OIDC in GitHub Actions, two permission layers must be checked separately.

```text
1. Trust Policy
   → Can GitHub Actions assume the IAM Role?

2. Permission Policy
   → Can the assumed Role perform the required AWS operation?
```

In this case, `sts:AssumeRoleWithWebIdentity` first failed due to a Trust Policy issue. After that was fixed, `ecr:GetAuthorizationToken` failed due to a Permission Policy issue.

A practical troubleshooting order for GitHub Actions AWS authentication issues is:

```text
1. Check whether workflow permissions include id-token: write
2. Check the role-to-assume value in configure-aws-credentials
3. Check the IAM Role Trust Policy repository / branch conditions
4. After successful role assumption, check the required AWS service permissions
5. Use the failed GitHub Actions step to separate the root cause
```

This issue clarified that OIDC authentication and AWS service permissions are separate concerns and must be diagnosed separately.

---

# 3. Missing `argocd-redis` Secret During Argo CD Installation

## Problem

After installing Argo CD on the EKS cluster, some Argo CD Pods did not run correctly.

```bash
kubectl get pods -n argocd -w
```

The initial state showed multiple issues at the same time.

<img src="./images/troubleshooting/argocd-install-initial-error.png" width="800">

Two problems appeared in the same screen:

```text
1. CreateContainerConfigError in argocd-repo-server
   → Missing argocd-redis Secret

2. Pending state for some Argo CD Pods
   → Pod capacity shortage on t3.small nodes
```

This section focuses on the missing `argocd-redis` Secret that caused `CreateContainerConfigError` in `argocd-repo-server`. The `Pending` issue caused by Pod capacity shortage is documented separately in the next section.

When I described the `argocd-repo-server` Pod, the following error was found:

```bash
kubectl describe pod -n argocd -l app.kubernetes.io/name=argocd-repo-server
```

Error message:

```text
Error: secret "argocd-redis" not found
```

I did not capture the `kubectl describe pod` screen at the time, so I recorded the key Event message as text.

---

## Attempts

### Attempt 1. Check Argo CD Pod status

I first checked the status of all Argo CD Pods.

```bash
kubectl get pods -n argocd
```

In the initial state, `argocd-repo-server` was in `CreateContainerConfigError`, and `argocd-dex-server` was in `Error` or `CrashLoopBackOff`.

Some Pods were also in `Pending`, but that was related to node Pod capacity and was treated as a separate issue.

Therefore, I first investigated the cause of `CreateContainerConfigError`.

### Attempt 2. Describe the Repo Server Pod

```bash
kubectl describe pod -n argocd -l app.kubernetes.io/name=argocd-repo-server
```

The `Events` section showed the following cause:

```text
Error: secret "argocd-redis" not found
```

The Repo Server was configured to read Redis authentication information from the `argocd-redis` Secret, but the Secret did not exist.

### Attempt 3. Manually create the `argocd-redis` Secret

I created the missing Redis Secret manually.

```bash
kubectl -n argocd create secret generic argocd-redis   --from-literal=auth="$(openssl rand -base64 32)"
```

Result:

```text
secret/argocd-redis created
```

### Attempt 4. Restart related Argo CD Pods

After creating the Secret, I restarted the related components so they could reference the new Secret.

```bash
kubectl rollout restart deployment -n argocd argocd-repo-server
kubectl rollout restart deployment -n argocd argocd-dex-server
kubectl rollout restart deployment -n argocd argocd-server
kubectl rollout restart deployment -n argocd argocd-redis
kubectl rollout restart statefulset -n argocd argocd-application-controller
```

Then I checked the Pod status again.

```bash
kubectl get pods -n argocd
```

---

## Comparison

| Attempt | Result | Judgment |
|---|---|---|
| Checked Pod status only | Found `CreateContainerConfigError`, `CrashLoopBackOff`, and `Pending` states | Needed to separate causes |
| Ran `kubectl describe pod` | Found missing `argocd-redis` Secret | Secret issue confirmed |
| Created the Secret manually | Redis auth Secret created | Correct fix direction |
| Restarted Argo CD Pods | Secret was applied | Missing Secret issue resolved |

---

## Verification Result

After creating the `argocd-redis` Secret and restarting related Pods, the `CreateContainerConfigError` caused by the missing Secret was resolved.

After also resolving the Pod capacity issue, all Argo CD components reached the `Running` state.

```bash
kubectl get pods -n argocd
```

<img src="./images/troubleshooting/argocd-pods-running.png" width="800">

In the Argo CD UI, the `koreanmate-backend` Application was shown as `Synced` and `Healthy`.

<img src="./images/troubleshooting/argocd-application-synced-healthy.png" width="800">

---

## Lessons Learned

`CreateContainerConfigError` can occur before the application inside the container even starts. It often means that a Kubernetes resource required for container creation is missing.

In particular, if a Secret or ConfigMap reference is missing, the container itself may fail to start before logs are generated.

A useful check order is:

```text
1. kubectl get pods
2. kubectl describe pod
3. Check Events for Secret / ConfigMap / Volume mount errors
4. Create the missing resource
5. Restart the Deployment / StatefulSet
```

In this issue, `kubectl describe pod` Events were more useful than Pod logs.

I also learned that multiple symptoms can appear in the same `kubectl get pods` output. `CreateContainerConfigError` and `Pending` should not be treated as the same root cause without checking their details separately.

---

# 4. EKS t3.small Node Pod Capacity Shortage

## Problem

While installing Argo CD and the Monitoring Stack on the EKS cluster, some Pods remained in the `Pending` state.

At first, I expected this to be a CPU or memory shortage. However, after checking the Node status, the real issue was the maximum number of Pods that could be scheduled on a single node.

```bash
kubectl describe nodes
```

In the single-node environment, the Node showed:

```text
Capacity:
  pods: 11

Allocatable:
  pods: 11

Non-terminated Pods: 11 in total
```

In other words, the single `t3.small` node had already reached its maximum Pod capacity.

Because of this, some Argo CD Pods stayed in `Pending`. Later, the Prometheus / Grafana Monitoring Stack also required additional Pod capacity.

---

## Attempts

### Attempt 1. Check Argo CD Pending Pods

After installing Argo CD, I checked the Pod status.

```bash
kubectl get pods -n argocd
```

The problematic state was:

```text
argocd-application-controller-0   Pending
argocd-redis                      Pending
argocd-server                     Pending
```

From this output alone, it was not clear whether the problem was CPU/memory shortage or Pod count capacity.

### Attempt 2. Check Node resources and Pod capacity

I checked the Node status to verify whether CPU or memory pressure existed.

```bash
kubectl describe nodes
```

`MemoryPressure`, `DiskPressure`, and `PIDPressure` were all `False`, and the Node was `Ready`.

However, `Non-terminated Pods` was 11, and `Allocatable pods` was also 11.

Therefore, the root cause was not CPU or memory shortage. It was the per-node Pod count limit.

### Attempt 3. Temporarily scale the NodeGroup desired size

For Argo CD and Monitoring Stack validation, I temporarily increased the EKS Managed NodeGroup size in `terraform.tfvars`.

Previous setting:

```hcl
node_desired_size = 1
node_min_size     = 1
node_max_size     = 1
```

Final updated setting:

```hcl
node_desired_size = 3
node_min_size     = 1
node_max_size     = 3
```

Then I applied Terraform.

```bash
cd infra/eks/envs/dev

terraform plan
terraform apply
```

### Attempt 4. Verify additional Nodes

After scaling the NodeGroup, I checked whether the Worker Node count increased to 3.

```bash
kubectl get nodes
```

All three Worker Nodes were in the `Ready` state.

<img src="./images/troubleshooting/eks-nodegroup-scaled-to-3.png" width="800">

### Attempt 5. Check Monitoring Stack Pod status

After Argo CD, I installed the Prometheus / Grafana Monitoring Stack.

The Monitoring Stack creates several Pods, including Prometheus, Grafana, Alertmanager, kube-state-metrics, and node-exporter. Since node-exporter runs as a DaemonSet, the Pod count increases as Nodes and add-ons increase.

```bash
kubectl get pods -n monitoring
```

All monitoring-related Pods reached the `Running` state.

<img src="./images/troubleshooting/monitoring-pods-running.png" width="800">

---

## Comparison

| Item | 1 Node | 3 Nodes |
|---|---|---|
| Instance type | t3.small | t3.small x 3 |
| Pod capacity | 11 Pods | Around 33 Pods |
| Some Argo CD Pods | Pending | Running |
| Monitoring Stack | Likely to hit Pod capacity shortage | Prometheus / Grafana Running |
| Cost | Lower | Higher |
| Purpose | Basic Backend validation | Temporary scale-up for GitOps / Monitoring validation |

---

## Lessons Learned

When using small instance types on EKS, Pod capacity must be considered in addition to CPU and memory.

The Pod count can increase quickly when the following components are deployed together:

```text
Default kube-system Pods
AWS Load Balancer Controller
Backend Application Pod
Argo CD components
Prometheus / Grafana stack
node-exporter DaemonSet
```

A small NodeGroup can be enough for validating a basic Backend deployment. However, when Argo CD and a Monitoring Stack are added, Pod capacity can become a limiting factor quickly.

For a personal portfolio environment where cost control matters, the realistic strategy is:

```text
1. Validate the basic Backend deployment with the minimum NodeGroup
2. Temporarily scale the NodeGroup for Argo CD / Monitoring validation
3. Scale down or destroy EKS after evidence capture and documentation
```

This issue showed that EKS operations require checking not only CPU and memory, but also Pod capacity, DaemonSet count, and add-on Pod count.

---

# Summary

```text
While building the EKS version, I resolved issues related to missing Backend Pod environment variables, insufficient GitHub Actions OIDC/ECR permissions, missing Argo CD Redis Secret, and Pod capacity limits on t3.small nodes.

These were not just simple error fixes. They were documented from the perspective of Kubernetes environment variable management, GitHub Actions OIDC authentication, ECR permission design, Kubernetes Secret references, and EKS node scheduling limits.
```
