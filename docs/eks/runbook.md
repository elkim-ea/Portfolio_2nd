# KoreanMate EKS Runbook

> 목적: KoreanMate EKS 버전 운영 중 발생할 수 있는 주요 장애 상황에 대해 확인 순서, 원인 분석 방법, 임시 대응, 복구 절차를 정리한다.
> 기준 환경: AWS Seoul Region `ap-northeast-2`, EKS `dev` 환경, Terraform 기반 Kubernetes 구조

---

## 1. Runbook 개요

KoreanMate EKS 버전은 Serverless 버전의 대체가 아니라, Kubernetes 운영 역량을 검증하기 위한 확장 버전이다.

Backend 애플리케이션은 Docker Image로 빌드되어 Amazon ECR에 저장되고, EKS Cluster 내부의 Backend Pod로 배포된다. 외부 요청은 AWS Load Balancer Controller가 생성한 ALB Ingress를 통해 Kubernetes Service와 Backend Pod로 전달된다.

운영 중 장애가 발생하면 다음 순서로 확인한다.

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

장애 대응의 기본 원칙은 다음과 같다.

| 원칙                  | 설명                                                                            |
| ------------------- | ----------------------------------------------------------------------------- |
| 영향 범위 확인            | ALB 문제인지, Kubernetes Service 문제인지, Backend Pod 문제인지 먼저 분리한다.                  |
| 최근 변경 확인            | 최근 GitHub Actions, Docker Image Push, Argo CD Sync, Terraform apply 내역을 확인한다. |
| Kubernetes 상태 우선 확인 | `kubectl get`, `kubectl describe`, `kubectl logs` 순서로 확인한다.                   |
| 로그와 이벤트 기반 판단       | 추측하지 않고 Pod logs, Events, Argo CD 상태, Prometheus/Grafana 지표를 기준으로 판단한다.       |
| 비용 관리 고려            | EKS는 지속 비용이 발생하므로 검증 후 NodeGroup 축소 또는 destroy를 수행한다.                         |
| 재발 방지 기록            | 장애 원인, 해결 과정, 배운 점을 `troubleshooting.md`에 기록한다.                               |

---

## 2. 주요 운영 도구

| 도구                           | 사용 목적                                            |
| ---------------------------- | ------------------------------------------------ |
| kubectl                      | EKS Cluster, Pod, Service, Ingress 상태 확인         |
| Terraform                    | EKS, VPC, NodeGroup, IAM, IRSA 리소스 관리            |
| GitHub Actions               | Backend Docker Image Build, Trivy Scan, ECR Push |
| Amazon ECR                   | Backend Docker Image 저장소                         |
| AWS Load Balancer Controller | Kubernetes Ingress 기반 ALB 생성                     |
| Argo CD                      | GitOps 기반 Kubernetes Manifest 동기화                |
| Prometheus                   | Kubernetes metrics 수집                            |
| Grafana                      | Cluster, Namespace, Pod metrics 시각화              |
| AWS IAM / IRSA               | Pod 단위 AWS 권한 제어                                 |
| AWS CLI                      | EKS, IAM, ECR, ALB 등 AWS 리소스 확인                  |

---

## 3. 공통 장애 확인 절차

장애가 발생하면 아래 순서대로 확인한다.

### 3.1 사용자 증상 확인

| 증상                   | 가능성                                               |
| -------------------- | ------------------------------------------------- |
| ALB 주소 접속 불가         | Ingress, ALB, Controller 문제                       |
| `/health` 실패         | Backend Pod, Service, Ingress 문제                  |
| API 500 발생           | Backend 코드, 환경변수, AWS 권한, Bedrock 호출 문제           |
| Pod Pending          | Node 리소스 부족, Pod capacity 부족                      |
| Pod CrashLoopBackOff | 환경변수 누락, 애플리케이션 시작 실패                             |
| Argo CD OutOfSync    | Git manifest와 Cluster 상태 불일치                      |
| Grafana metrics 미표시  | Prometheus target, ServiceMonitor, Pod metrics 문제 |

### 3.2 최근 변경 확인

최근 Git 변경 확인:

```bash
git log --oneline -5
```

GitHub Actions 확인:

```text
GitHub Repository
→ Actions
→ EKS Backend Image Build
→ 최근 실패 Job 확인
```

Argo CD 동기화 상태 확인:

```text
Argo CD UI
→ koreanmate-backend
→ Sync Status / Health Status 확인
```

Terraform 변경 여부 확인:

```bash
cd infra/eks/envs/dev
terraform plan
```

### 3.3 EKS 기본 상태 확인

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

## 4. EKS Cluster / Node 장애

### 증상

| 증상                              | 가능성                              |
| ------------------------------- | -------------------------------- |
| Node가 Ready가 아님                 | NodeGroup 문제, kubelet 문제         |
| Pod가 Pending                    | CPU/Memory 부족 또는 Pod capacity 부족 |
| Argo CD / Monitoring Pod가 뜨지 않음 | t3.small 노드의 Pod 개수 제한           |
| Node 수가 예상과 다름                  | Terraform NodeGroup 설정 불일치       |

### 확인 절차

Node 상태 확인:

```bash
kubectl get nodes
```

Node 상세 확인:

```bash
kubectl describe nodes
```

확인할 항목:

```text
Ready
MemoryPressure
DiskPressure
PIDPressure
Allocatable pods
Non-terminated Pods
```

Terraform NodeGroup 설정 확인:

```bash
cd infra/eks/envs/dev
terraform plan
```

### 대응 방법

Pod capacity 부족이면 NodeGroup을 임시 확장한다.

예시: Argo CD 검증용

```hcl
node_desired_size = 2
node_min_size     = 1
node_max_size     = 2
```

예시: Prometheus / Grafana 검증용

```hcl
node_desired_size = 3
node_min_size     = 1
node_max_size     = 3
```

적용:

```bash
cd infra/eks/envs/dev
terraform plan
terraform apply
```

### 복구 기준

| 기준             | 확인 방법                            |
| -------------- | -------------------------------- |
| Node Ready     | `kubectl get nodes`              |
| Pending Pod 감소 | `kubectl get pods -A`            |
| Argo CD 정상화    | `kubectl get pods -n argocd`     |
| Monitoring 정상화 | `kubectl get pods -n monitoring` |

---

## 5. Backend Pod 장애

### 증상

| 증상                   | 가능성                         |
| -------------------- | --------------------------- |
| Pod CrashLoopBackOff | 환경변수 누락, 애플리케이션 시작 실패       |
| Pod ImagePullBackOff | ECR image tag 오류, ECR 권한 문제 |
| Pod Pending          | Node 리소스 또는 Pod capacity 부족 |
| 로그에 ZodError 발생      | 필수 환경변수 누락                  |
| AWS 호출 실패            | IRSA 권한 문제                  |

### 확인 절차

Backend Pod 상태 확인:

```bash
kubectl get pods -n koreanmate
```

Pod 상세 확인:

```bash
kubectl describe pod -n koreanmate <backend-pod-name>
```

Backend 로그 확인:

```bash
kubectl logs -n koreanmate deployment/backend
```

최근 로그만 확인:

```bash
kubectl logs -n koreanmate deployment/backend --tail=100
```

Deployment 환경변수 확인:

```bash
kubectl describe deployment backend -n koreanmate
```

### 대응 방법

환경변수 누락이면 `deploy/k8s/backend/deployment.yaml`의 `env` 항목을 확인한다.

필수 환경변수 예시:

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

수정 후 재적용:

```bash
kubectl apply -f deploy/k8s/backend/
kubectl rollout status deployment/backend -n koreanmate
```

필요 시 Deployment 재시작:

```bash
kubectl rollout restart deployment/backend -n koreanmate
```

### 복구 기준

| 기준                      | 확인 방법                               |
| ----------------------- | ----------------------------------- |
| Backend Pod Running     | `kubectl get pods -n koreanmate`    |
| Server running 로그 확인    | `kubectl logs`                      |
| Service health check 성공 | `curl http://localhost:8081/health` |
| ALB health check 성공     | `curl http://<ALB_DNS_NAME>/health` |

---

## 6. Backend Service / 내부 통신 장애

### 증상

| 증상                          | 가능성                             |
| --------------------------- | ------------------------------- |
| Pod는 Running인데 `/health` 실패 | Service selector 문제             |
| port-forward 실패             | Service 또는 Pod endpoint 문제      |
| Service endpoint 없음         | Pod label과 Service selector 불일치 |
| ALB는 있으나 target unhealthy   | Service targetPort 문제           |

### 확인 절차

Service 확인:

```bash
kubectl get service -n koreanmate
```

Service 상세 확인:

```bash
kubectl describe service backend -n koreanmate
```

Endpoint 확인:

```bash
kubectl get endpoints -n koreanmate
```

내부 health check:

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
```

다른 터미널에서 확인:

```bash
curl http://localhost:8081/health
```

### 대응 방법

1. Service selector와 Deployment label이 일치하는지 확인한다.
2. Service `targetPort`가 Backend container port와 일치하는지 확인한다.
3. Backend Pod가 `Running` 상태인지 확인한다.
4. Endpoint가 비어 있으면 Service selector를 수정한다.

### 복구 기준

| 기준                 | 확인 방법                                 |
| ------------------ | ------------------------------------- |
| Service 존재         | `kubectl get svc -n koreanmate`       |
| Endpoint 존재        | `kubectl get endpoints -n koreanmate` |
| 내부 health check 성공 | `curl http://localhost:8081/health`   |

---

## 7. ALB Ingress 장애

### 증상

| 증상                 | 가능성                             |
| ------------------ | ------------------------------- |
| Ingress ADDRESS 없음 | AWS Load Balancer Controller 문제 |
| ALB DNS 접속 실패      | ALB 생성 실패 또는 보안 그룹 문제           |
| `/health` 503      | Target Group unhealthy          |
| Ingress 이벤트 오류     | Annotation, Subnet, IAM 권한 문제   |

### 확인 절차

Ingress 확인:

```bash
kubectl get ingress -n koreanmate
```

Ingress 상세 확인:

```bash
kubectl describe ingress backend -n koreanmate
```

AWS Load Balancer Controller 확인:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

Controller 로그 확인:

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

ALB health check:

```bash
curl http://<ALB_DNS_NAME>/health
```

### 대응 방법

1. AWS Load Balancer Controller Pod가 Running인지 확인한다.
2. Controller ServiceAccount의 IRSA annotation을 확인한다.
3. Ingress annotation을 확인한다.
4. Service endpoint가 존재하는지 확인한다.
5. AWS Console에서 Target Group health를 확인한다.

### 복구 기준

| 기준                     | 확인 방법                               |
| ---------------------- | ----------------------------------- |
| Ingress ADDRESS 생성     | `kubectl get ingress -n koreanmate` |
| ALB Controller Running | `kubectl get pods -n kube-system`   |
| ALB health check 성공    | `curl http://<ALB_DNS_NAME>/health` |

---

## 8. IRSA / AWS 권한 장애

### 증상

| 증상                       | 가능성                                  |
| ------------------------ | ------------------------------------ |
| Backend에서 DynamoDB 접근 실패 | Backend Pod IRSA 권한 부족               |
| Bedrock 호출 실패            | `bedrock:InvokeModel` 권한 누락          |
| SSM Parameter 조회 실패      | `ssm:GetParameter` 권한 누락             |
| ALB가 생성되지 않음             | AWS Load Balancer Controller IRSA 문제 |
| AccessDenied 발생          | IAM Policy 또는 Trust Policy 문제        |

### 확인 절차

Backend ServiceAccount 확인:

```bash
kubectl describe serviceaccount backend -n koreanmate
```

AWS Load Balancer Controller ServiceAccount 확인:

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

Backend Pod IAM Role 확인:

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-backend-pod-role
```

ALB Controller IAM Role 확인:

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-aws-load-balancer-controller-role
```

### 대응 방법

1. ServiceAccount에 `eks.amazonaws.com/role-arn` annotation이 있는지 확인한다.
2. IAM Role Trust Policy에 OIDC provider가 연결되어 있는지 확인한다.
3. Trust Policy의 subject가 올바른 ServiceAccount인지 확인한다.
4. IAM Policy에 필요한 AWS API 권한이 포함되어 있는지 확인한다.

Backend Pod Trust Policy 기준:

```text
system:serviceaccount:koreanmate:backend
```

### 복구 기준

| 기준                           | 확인 방법                             |
| ---------------------------- | --------------------------------- |
| ServiceAccount annotation 존재 | `kubectl describe serviceaccount` |
| Trust Policy subject 일치      | `aws iam get-role`                |
| Backend API 정상 응답            | ALB API 호출                        |
| ALB 자동 생성                    | `kubectl get ingress`             |

---

## 9. Backend API 500 장애

### 증상

ALB 주소를 통해 API를 호출했을 때 500 응답이 반환된다.

검증 대상 API:

```text
POST /correction
POST /conversation
POST /level-test
```

### 주요 원인

| 원인             | 설명                             |
| -------------- | ------------------------------ |
| 환경변수 누락        | Table name, Model ID 등 누락      |
| IRSA 권한 부족     | DynamoDB, SSM, Bedrock 접근 실패   |
| Bedrock 호출 실패  | Model ID, 리전, 권한 문제            |
| DynamoDB 저장 실패 | Table name, Key schema, IAM 문제 |
| Backend 코드 오류  | Container runtime에서 예외 발생      |

### 확인 절차

Backend 로그 확인:

```bash
kubectl logs -n koreanmate deployment/backend --tail=100
```

Pod 상태 확인:

```bash
kubectl get pods -n koreanmate
```

환경변수 확인:

```bash
kubectl describe deployment backend -n koreanmate
```

ALB API 호출:

```bash
curl -X POST http://<ALB_DNS_NAME>/correction \
  -H "Content-Type: application/json" \
  -d '{
    "text": "나는 어제 학교에 가요.",
    "level": "a2"
  }'
```

### 대응 방법

1. 로그에서 실제 에러 메시지를 확인한다.
2. 환경변수 누락이면 Deployment manifest를 수정한다.
3. AccessDenied이면 Backend Pod IRSA Role 권한을 확인한다.
4. Bedrock 오류이면 Model ID와 리전을 확인한다.
5. DynamoDB 오류이면 Table name과 key schema를 확인한다.

### 복구 기준

| 기준                   | 확인 방법             |
| -------------------- | ----------------- |
| API HTTP 200         | curl 테스트          |
| Backend 로그에 Error 없음 | `kubectl logs`    |
| DynamoDB 저장 성공       | DynamoDB table 조회 |
| Bedrock 결과 반환        | API 응답 body 확인    |

---

## 10. Argo CD 장애

### 증상

| 증상                    | 가능성                                 |
| --------------------- | ----------------------------------- |
| Argo CD Pod Pending   | Node Pod capacity 부족                |
| Repo Server Error     | Secret / ConfigMap 누락               |
| Application OutOfSync | Git manifest와 Cluster 상태 불일치        |
| Application Degraded  | Pod, Service, Ingress 장애            |
| UI 접속 불가              | port-forward 중단 또는 argocd-server 문제 |

### 확인 절차

Argo CD Pod 상태 확인:

```bash
kubectl get pods -n argocd
```

Application 확인:

```bash
kubectl get applications -n argocd
```

Application 상세 확인:

```bash
kubectl describe application koreanmate-backend -n argocd
```

Argo CD UI 접속:

```bash
kubectl port-forward svc/argocd-server -n argocd 8082:443
```

브라우저 접속:

```text
https://localhost:8082
```

### 대응 방법

1. Argo CD Pod가 Running인지 확인한다.
2. `CreateContainerConfigError`이면 Secret / ConfigMap 누락 여부를 확인한다.
3. `Pending`이면 Node capacity를 확인한다.
4. Application이 OutOfSync이면 GitHub branch, path, manifest 변경 사항을 확인한다.
5. 필요 시 Argo CD UI에서 Sync를 수동 실행한다.

### 복구 기준

| 기준                  | 확인 방법                            |
| ------------------- | -------------------------------- |
| Argo CD Pod Running | `kubectl get pods -n argocd`     |
| Application Synced  | Argo CD UI                       |
| Application Healthy | Argo CD UI                       |
| Backend Pod 정상      | `kubectl get pods -n koreanmate` |

---

## 11. Prometheus / Grafana 장애

### 증상

| 증상                  | 가능성                                  |
| ------------------- | ------------------------------------ |
| Prometheus Pending  | Node 리소스 또는 Pod capacity 부족          |
| Grafana 접속 불가       | port-forward 중단                      |
| Targets DOWN        | Prometheus scrape 실패                 |
| Backend metrics 미표시 | Namespace/Pod 선택 오류 또는 metrics 수집 문제 |
| Dashboard 데이터 없음    | Prometheus datasource 문제             |

### 확인 절차

Monitoring Pod 상태 확인:

```bash
kubectl get pods -n monitoring
```

Prometheus Targets 접속:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

브라우저:

```text
http://localhost:9090/targets
```

Grafana 접속:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

브라우저:

```text
http://localhost:3002
```

Grafana password 확인:

```bash
kubectl get secret -n monitoring monitoring-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

### 대응 방법

1. Monitoring Pod가 모두 Running인지 확인한다.
2. Prometheus Server가 Pending이면 `kubectl describe pod`로 Events를 확인한다.
3. Node 리소스 또는 Pod capacity 부족이면 NodeGroup을 임시 확장한다.
4. Grafana 접속 실패 시 port-forward가 켜져 있는지 확인한다.
5. Prometheus Targets에서 scrape 대상이 `UP`인지 확인한다.

### 복구 기준

| 기준                     | 확인 방법                                |
| ---------------------- | ------------------------------------ |
| Monitoring Pod Running | `kubectl get pods -n monitoring`     |
| Prometheus Targets UP  | `/targets` 화면                        |
| Grafana 접속 성공          | `http://localhost:3002`              |
| Backend metrics 표시     | Kubernetes Namespace(Pods) Dashboard |

---

## 12. GitHub Actions / ECR 장애

### 증상

| 증상             | 가능성                               |
| -------------- | --------------------------------- |
| Image build 실패 | Dockerfile, TypeScript build 문제   |
| Trivy scan 실패  | 이미지 취약점 또는 scan 설정 문제             |
| ECR push 실패    | GitHub OIDC, IAM 권한, ECR login 문제 |
| EKS가 이전 이미지 사용 | image tag 미변경 또는 pull 정책 문제       |

### 확인 절차

GitHub Actions 확인:

```text
GitHub Repository
→ Actions
→ EKS Backend Image Build
→ 실패한 Step 로그 확인
```

ECR 이미지 확인:

```bash
aws ecr describe-images \
  --repository-name koreanmate-dev-backend \
  --region ap-northeast-2 \
  --image-ids imageTag=dev
```

현재 Deployment image 확인:

```bash
kubectl get deployment backend -n koreanmate \
  -o jsonpath="{.spec.template.spec.containers[0].image}"
```

### 대응 방법

1. 실패한 GitHub Actions step을 확인한다.
2. Docker build 실패면 로컬에서 동일하게 재현한다.
3. ECR push 실패면 GitHub OIDC Role의 ECR 권한을 확인한다.
4. 이미지가 갱신되었지만 Pod가 이전 이미지를 사용하면 rollout restart를 실행한다.

```bash
kubectl rollout restart deployment/backend -n koreanmate
```

### 복구 기준

| 기준                  | 확인 방법                            |
| ------------------- | -------------------------------- |
| GitHub Actions 성공   | Actions 화면                       |
| ECR image digest 생성 | `aws ecr describe-images`        |
| Backend Pod Running | `kubectl get pods -n koreanmate` |
| API 정상 응답           | curl 테스트                         |

---

## 13. 비용 증가 대응

### 증상

EKS 리소스 검증 후 AWS 비용이 예상보다 빠르게 증가한다.

### 주요 원인

| 원인                   | 설명                              |
| -------------------- | ------------------------------- |
| EKS Control Plane    | 클러스터가 존재하는 동안 비용 발생             |
| Worker Node          | EC2 NodeGroup 비용 발생             |
| ALB                  | Ingress로 생성된 ALB 비용 발생          |
| EBS Volume           | Node 또는 monitoring 관련 volume 비용 |
| CloudWatch Logs      | 로그 저장 비용                        |
| Prometheus / Grafana | Pod 리소스 사용으로 Node 확장 필요         |
| NAT Gateway          | 사용하는 경우 지속 비용 발생                |

### 확인 절차

현재 Node 확인:

```bash
kubectl get nodes
```

전체 Pod 확인:

```bash
kubectl get pods -A
```

Terraform 리소스 확인:

```bash
cd infra/eks/envs/dev
terraform state list
```

AWS Cost Explorer 확인:

```text
AWS Console
→ Billing and Cost Management
→ Cost Explorer
→ Service별 비용 확인
```

### 대응 방법

검증이 끝나면 먼저 Helm 리소스를 삭제한다.

```bash
helm uninstall monitoring -n monitoring
```

Argo CD 삭제:

```bash
kubectl delete namespace argocd
```

Monitoring namespace 삭제:

```bash
kubectl delete namespace monitoring
```

Backend application 삭제:

```bash
kubectl delete -f deploy/k8s/backend/
```

EKS 전체 삭제:

```bash
cd infra/eks/envs/dev
terraform destroy
```

### 복구 기준

| 기준             | 확인 방법                               |
| -------------- | ----------------------------------- |
| EKS Cluster 삭제 | `aws eks list-clusters`             |
| ALB 삭제         | `aws elbv2 describe-load-balancers` |
| 불필요 EBS 없음     | `aws ec2 describe-volumes`          |
| 비용 증가 중단       | Cost Explorer                       |

---

## 14. 긴급 복구 체크리스트

장애 발생 시 최소한 아래 항목을 빠르게 확인한다.

```text
[ ] kubectl context가 koreanmate-dev-eks-cluster인지 확인
[ ] EKS Node가 Ready 상태인지 확인
[ ] Backend Pod가 Running 상태인지 확인
[ ] Backend Pod logs에서 에러 확인
[ ] Service endpoint가 존재하는지 확인
[ ] Ingress에 ALB DNS가 생성되었는지 확인
[ ] ALB /health 응답 확인
[ ] AWS Load Balancer Controller 상태 확인
[ ] Backend ServiceAccount IRSA annotation 확인
[ ] Argo CD Application Synced / Healthy 확인
[ ] Prometheus Targets UP 확인
[ ] Grafana에서 backend Pod metrics 확인
[ ] 최근 GitHub Actions Image Build 실패
```
