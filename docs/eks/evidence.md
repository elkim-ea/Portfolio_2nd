# KoreanMate EKS Evidence

> 목적: KoreanMate EKS 버전에서 Kubernetes 기반 배포, GitHub Actions 이미지 빌드, ECR Push, ALB Ingress, IRSA, Argo CD GitOps, Prometheus/Grafana 관측성 구성이 실제로 동작했음을 증명하기 위한 캡처 정리 문서다.
> 기준 환경: AWS Seoul Region `ap-northeast-2`, EKS `dev` 환경, Terraform 기반 IaC

---

## 1. EKS Cluster / NodeGroup 생성 확인

EKS 클러스터와 Managed NodeGroup을 Terraform으로 생성한 뒤, `kubectl get nodes` 명령으로 Worker Node가 정상적으로 EKS 클러스터에 조인되었는지 확인했다.

```bash
kubectl get nodes
```

확인 결과, Worker Node가 `Ready` 상태로 표시되었다.

<img src="./images/01-eks-nodes-ready.png" width="800">

---

## 2. ECR Backend Image Push 확인

Backend 컨테이너 이미지를 Docker로 빌드한 뒤 Amazon ECR Repository에 `dev` 태그로 Push했다.

```bash
aws ecr describe-images \
  --repository-name koreanmate-dev-backend \
  --region ap-northeast-2 \
  --image-ids imageTag=dev
```

확인 결과, `koreanmate-dev-backend:dev` 이미지가 ECR에 정상적으로 업로드되었고 image digest가 생성되었다.

<img src="./images/02-ecr-image-push-success.png" width="800">

---

## 3. GitHub Actions EKS Image Build 성공 확인

GitHub Actions에서 Backend Docker Image Build, Trivy Scan, ECR Push가 자동으로 수행되도록 구성했다.

Workflow:

```text
EKS Backend Image Build
```

확인 결과, 전체 checks가 통과했고 Backend image build 및 push job이 성공했다.

<img src="./images/03-github-actions-eks-image-build-success.png" width="800">

---

## 4. Trivy Image Scan 결과 확인

GitHub Actions workflow 안에서 Trivy를 사용하여 Backend Docker Image의 취약점을 스캔했다.

Trivy 실행 대상:

```text
koreanmate-dev-backend:dev
```

스캔 결과는 GitHub Actions 로그에 남으며, HIGH/CRITICAL 취약점 확인 및 이미지 보안 검증 근거로 사용한다.

<img src="./images/04-trivy-scan-result.png" width="800">

---

## 5. AWS Load Balancer Controller 구성 확인

AWS Load Balancer Controller를 EKS 클러스터에 설치하고, Controller Pod가 `kube-system` namespace에서 정상적으로 실행되는지 확인했다.

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

확인 결과, AWS Load Balancer Controller Pod 2개가 모두 `Running` 상태였다.

<img src="./images/05-alb-controller-running.png" width="800">

---

## 6. AWS Load Balancer Controller IRSA 확인

AWS Load Balancer Controller가 AWS 리소스를 제어할 수 있도록 IAM Role을 ServiceAccount에 연결했다.

```bash
kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
```

확인 결과, ServiceAccount에 IAM Role ARN annotation이 정상적으로 연결되었다.

```text
eks.amazonaws.com/role-arn: arn:aws:iam::127696278675:role/koreanmate-dev-eks-cluster-aws-load-balancer-controller-role
```

<img src="./images/06-alb-controller-irsa.png" width="800">

---

## 7. Backend Pod IRSA Role 확인

Backend Pod가 DynamoDB, SSM Parameter Store, Bedrock에 접근할 수 있도록 Backend 전용 IAM Role을 구성했다.

```bash
aws iam get-role \
  --role-name koreanmate-dev-eks-cluster-backend-pod-role
```

확인 결과, IAM Role의 trust policy가 `system:serviceaccount:koreanmate:backend` ServiceAccount만 AssumeRoleWithWebIdentity를 수행할 수 있도록 제한되어 있었다.

```text
system:serviceaccount:koreanmate:backend
```

<img src="./images/07-backend-pod-irsa-role.png" width="800">

---

## 8. Backend Pod 배포 확인

Kubernetes Deployment를 통해 Backend Pod를 EKS에 배포했다.

```bash
kubectl get pods -n koreanmate
```

확인 결과, Backend Pod가 `Running` 상태로 실행되었다.

<img src="./images/08-backend-pod-running.png" width="800">

---

## 9. Backend Service 내부 통신 확인

Kubernetes Service가 Backend Pod로 정상적으로 트래픽을 전달하는지 확인하기 위해 port-forward로 `/health` endpoint를 호출했다.

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
```

```bash
curl http://localhost:8081/health
```

응답:

```json
{"status":"ok","service":"koreanmate-backend","runtime":"container"}
```

<img src="./images/09-backend-service-health-success.png" width="800">

---

## 10. ALB Ingress 외부 접근 확인

AWS Load Balancer Controller가 Ingress 리소스를 기반으로 ALB를 생성했고, 외부 ALB 주소를 통해 Backend `/health` endpoint에 접근할 수 있는지 확인했다.

```bash
kubectl get ingress -n koreanmate
```

```bash
curl http://<ALB_DNS_NAME>/health
```

응답:

```json
{"status":"ok","service":"koreanmate-backend","runtime":"container"}
```

<img src="./images/10-alb-health-success.png" width="800">

---

## 11. Backend API 호출 검증

ALB 주소를 통해 실제 Backend API를 호출하여 EKS 환경에서도 주요 기능이 정상 동작하는지 확인했다.

검증한 API:

```text
POST /correction
POST /conversation
POST /level-test
```

확인 결과, 세 API 모두 ALB Ingress를 통해 정상 응답했다.

<img src="./images/11-api-verification-success.png" width="800">

---

## 12. Argo CD 설치 확인

Argo CD를 EKS 클러스터에 설치한 뒤, 모든 Argo CD 구성 요소가 `Running` 상태인지 확인했다.

```bash
kubectl get pods -n argocd
```

확인 결과, Argo CD Application Controller, Repo Server, Redis, Dex Server, Argo CD Server가 모두 정상 실행되었다.

<img src="./images/12-argocd-pods-running.png" width="800">

---

## 13. Argo CD Application Synced / Healthy 확인

Argo CD Application을 생성하여 GitHub Repository의 Kubernetes manifest를 감시하도록 구성했다.

Application 설정:

```text
Application: koreanmate-backend
Repository: https://github.com/elkim-ea/Portfolio_2nd.git
Target Revision: eks
Path: deploy/k8s/backend
Destination: in-cluster
Namespace: koreanmate
```

확인 결과, Argo CD UI에서 `koreanmate-backend` Application이 `Synced` 및 `Healthy` 상태로 표시되었다.

<img src="./images/13-argocd-synced-healthy.png" width="800">

---

## 14. Monitoring Stack Pod 확인

Prometheus / Grafana / Alertmanager / kube-state-metrics / node-exporter를 설치한 뒤 monitoring namespace의 Pod 상태를 확인했다.

```bash
kubectl get pods -n monitoring
```

확인 결과, 모든 monitoring 구성 요소가 `Running` 상태로 실행되었다.

<img src="./images/14-monitoring-pods-running.png" width="800">

---

## 15. Prometheus Targets UP 확인

Prometheus Targets 화면에서 scrape 대상이 정상적으로 수집되고 있는지 확인했다.

접속 방식:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

```text
http://localhost:9090/targets
```

확인 결과, Grafana 및 Alertmanager targets가 `UP` 상태로 표시되었다.

<img src="./images/15-prometheus-targets-up.png" width="800">

---

## 16. Grafana Cluster Dashboard 확인

Grafana Kubernetes dashboard에서 EKS 클러스터 전체의 CPU, Memory, Namespace별 리소스 사용량을 확인했다.

접속 방식:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

```text
http://localhost:3002
```

확인 결과, `argocd`, `monitoring`, `kube-system`, `koreanmate` namespace의 CPU/Memory 사용량이 Grafana dashboard에 표시되었다.

<img src="./images/16-grafana-cluster-dashboard.png" width="800">

---

## 17. Grafana KoreanMate Backend Pod Metrics 확인

Grafana의 Kubernetes Namespace(Pods) dashboard에서 `koreanmate` namespace를 선택하고 Backend Pod의 CPU, Memory, Network metrics를 확인했다.

확인 대상:

```text
Namespace: koreanmate
Pod: backend-*
```

확인 결과, KoreanMate Backend Pod의 CPU usage, memory usage, network receive/transmit metrics가 정상적으로 표시되었다.

<img src="./images/17-grafana-backend-pod-metrics.png" width="800">

---

## 18. Evidence Summary

이번 EKS 버전에서 검증한 항목은 다음과 같다.

| 영역          | 검증 내용                                               | 상태 |
| ----------- | --------------------------------------------------- | -- |
| EKS Cluster | Worker Node Ready 확인                                | 완료 |
| ECR         | Backend Docker Image Push 확인                        | 완료 |
| CI/CD       | GitHub Actions Image Build / Push 확인                | 완료 |
| Security    | Trivy Image Scan 확인                                 | 완료 |
| IAM         | ALB Controller IRSA 확인                              | 완료 |
| IAM         | Backend Pod IRSA 확인                                 | 완료 |
| Kubernetes  | Backend Deployment / Service 확인                     | 완료 |
| Ingress     | ALB Ingress 외부 접근 확인                                | 완료 |
| API         | `/correction`, `/conversation`, `/level-test` 호출 성공 | 완료 |
| GitOps      | Argo CD Synced / Healthy 확인                         | 완료 |
| Monitoring  | Prometheus Targets UP 확인                            | 완료 |
| Monitoring  | Grafana Backend Pod Metrics 확인                      | 완료 |

---

## 19. Cost Control Note

EKS는 클러스터와 NodeGroup이 존재하는 동안 비용이 지속적으로 발생한다.
따라서 이 EKS 버전은 상시 운영 목적이 아니라, Kubernetes 운영 역량을 검증하고 증거를 남기기 위한 확장 버전이다.

검증 및 문서화 완료 후에는 다음 중 하나를 수행한다.

```text
1. NodeGroup desired size를 최소화
2. EKS 리소스 destroy
```
