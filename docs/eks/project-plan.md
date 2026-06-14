# KoreanMate EKS Project Plan

> 관련 문서: `docs/overview.md`, `docs/eks/eks-design.md`, `docs/eks/runbook.md`, `docs/eks/troubleshooting.md`, `docs/eks/evidence.md`

---

## 1. 프로젝트 개요

KoreanMate EKS 버전은 기존 KoreanMate 백엔드를 Kubernetes 환경에서 운영할 수 있도록 확장한 프로젝트다.

KoreanMate는 한국어를 학습하는 외국인 사용자를 대상으로 하는 AI 기반 한국어 학습 웹 애플리케이션이다. 사용자는 한국어 문장 교정, 상황별 회화 생성, 레벨 테스트 기능을 사용할 수 있으며, 학습 결과와 사용량은 사용자별로 저장된다.

EKS 버전의 목적은 새로운 기능을 추가하는 것이 아니라, 기존 Backend API를 컨테이너화하고 Amazon EKS에 배포하여 Kubernetes 기반 운영 환경을 검증하는 것이다.

이 프로젝트를 통해 다음 역량을 보여주는 것을 목표로 한다.

* Docker 기반 Backend 컨테이너화
* Amazon ECR 기반 이미지 저장
* Terraform 기반 EKS Cluster / NodeGroup 구성
* Kubernetes Deployment / Service / Ingress 구성
* AWS Load Balancer Controller 기반 ALB Ingress 연동
* IRSA 기반 Pod 단위 AWS 권한 제어
* GitHub Actions 기반 Docker image build / scan / push 자동화
* Trivy 기반 컨테이너 이미지 보안 스캔
* Argo CD 기반 GitOps 배포
* Prometheus / Grafana 기반 Kubernetes 관측성 구성
* EKS 비용 관리와 검증 후 리소스 정리 전략

---

## 2. 문제 정의

Kubernetes 기반 운영 환경을 포트폴리오에서 보여주기 위해서는 단순히 애플리케이션을 컨테이너로 실행하는 것만으로는 부족하다.

EKS 운영 환경에서는 다음과 같은 문제를 직접 해결해야 한다.

| 문제                | 설명                                                                |
| ----------------- | ----------------------------------------------------------------- |
| 컨테이너 실행 환경 분리 필요  | Lambda 기반 코드와 달리 EKS에서는 Backend가 장기 실행되는 HTTP 서버 형태로 동작해야 한다.     |
| 이미지 배포 자동화 필요     | Docker image를 수동으로 빌드하고 Push하면 배포 이력이 불명확해진다.                     |
| AWS 권한 관리 필요      | Pod에서 DynamoDB, SSM, Bedrock에 접근하려면 IAM Role을 안전하게 연결해야 한다.       |
| 외부 트래픽 연결 필요      | Kubernetes 내부 Service를 외부 사용자가 접근할 수 있도록 ALB Ingress가 필요하다.       |
| GitOps 운영 검증 필요   | Kubernetes manifest 변경 사항이 Git 기준으로 배포되는 구조가 필요하다.                |
| 컨테이너 보안 검증 필요     | 이미지 취약점을 확인하지 않으면 운영 이미지의 보안 수준을 설명하기 어렵다.                        |
| Kubernetes 관측성 필요 | Pod, Namespace, Node 상태를 metrics 기반으로 확인할 수 있어야 한다.               |
| 비용 증가 위험          | EKS Cluster, NodeGroup, ALB, Monitoring Stack은 유지 비용이 지속적으로 발생한다. |

KoreanMate EKS 버전은 위 문제를 해결하면서 Kubernetes 운영 흐름을 직접 구축하고 검증하는 것을 목표로 한다.

---

## 3. 프로젝트 목표

### 3.1 서비스 목표

| 목표                | 설명                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------- |
| Backend API 컨테이너화 | 기존 Backend API를 Express 기반 HTTP 서버로 실행할 수 있도록 구성한다.                                 |
| EKS 배포 검증         | Backend Pod를 EKS Cluster에 배포하고 Kubernetes Service로 연결한다.                            |
| 외부 API 접근 검증      | ALB Ingress를 통해 `/health`, `/correction`, `/conversation`, `/level-test` API를 호출한다. |
| AWS 서비스 연동 유지     | Backend Pod에서 DynamoDB, SSM Parameter Store, Bedrock 접근을 유지한다.                      |
| GitOps 배포 검증      | Argo CD가 GitHub repository의 Kubernetes manifest를 감시하고 동기화하도록 구성한다.                  |
| 관측성 검증            | Prometheus와 Grafana로 EKS Cluster, Namespace, Backend Pod metrics를 확인한다.             |

### 3.2 인프라 목표

| 목표                     | 설명                                                                 |
| ---------------------- | ------------------------------------------------------------------ |
| EKS Cluster 구성         | Terraform으로 EKS Cluster와 Managed NodeGroup을 생성한다.                  |
| ECR Repository 구성      | Backend Docker image를 저장할 ECR Repository를 생성한다.                    |
| ALB Ingress 구성         | AWS Load Balancer Controller를 통해 Kubernetes Ingress에서 ALB를 생성한다.   |
| IRSA 구성                | Backend Pod와 AWS Load Balancer Controller에 각각 필요한 IAM Role을 연결한다.  |
| Kubernetes Manifest 구성 | Namespace, ServiceAccount, Deployment, Service, Ingress를 코드로 관리한다. |
| GitHub Actions 구성      | Docker build, Trivy scan, ECR push를 자동화한다.                         |
| Argo CD 구성             | GitHub repository의 manifest를 기준으로 EKS 배포 상태를 관리한다.                 |
| Monitoring Stack 구성    | Prometheus, Grafana, kube-state-metrics, node-exporter를 설치한다.      |
| 비용 관리                  | 검증 완료 후 NodeGroup 축소 또는 EKS destroy를 수행한다.                         |

### 3.3 포트폴리오 목표

이 프로젝트로 보여주려는 역량은 다음과 같다.

* Kubernetes 기반 애플리케이션 배포 능력
* EKS Cluster와 NodeGroup 구성 경험
* Docker image build와 ECR Push 자동화 경험
* Kubernetes Service / Ingress 트래픽 흐름 이해
* AWS Load Balancer Controller와 ALB 연동 경험
* IRSA 기반 Pod 단위 AWS 권한 제어 이해
* Argo CD 기반 GitOps 운영 경험
* Prometheus / Grafana 기반 Kubernetes metrics 관측 경험
* Trivy 기반 컨테이너 이미지 보안 스캔 경험
* EKS 비용 구조를 이해하고 검증 후 삭제하는 운영 판단 능력
* Troubleshooting / Runbook / Evidence 문서화 역량

---

## 4. 주요 사용자와 사용 시나리오

### 4.1 주요 사용자

KoreanMate EKS 버전의 주요 사용자는 실제 최종 사용자보다, 포트폴리오를 검토하는 기술 면접관 또는 클라우드/DevOps 관점의 리뷰어다.

### 4.2 기본 검증 시나리오

1. 개발자가 Backend 코드를 수정한다.
2. GitHub Actions가 Backend Docker image를 빌드한다.
3. Trivy가 Docker image를 스캔한다.
4. 이미지가 Amazon ECR에 Push된다.
5. Kubernetes Deployment가 ECR image를 사용해 Backend Pod를 실행한다.
6. AWS Load Balancer Controller가 Ingress를 기준으로 ALB를 생성한다.
7. ALB 주소로 `/health`와 주요 API를 호출한다.
8. Argo CD에서 Application이 `Synced` / `Healthy` 상태인지 확인한다.
9. Prometheus Targets가 `UP` 상태인지 확인한다.
10. Grafana에서 `koreanmate` namespace와 Backend Pod metrics를 확인한다.
11. 검증 완료 후 비용 절감을 위해 NodeGroup을 축소하거나 EKS 리소스를 삭제한다.

---

## 5. 기능 범위

### 5.1 구현 범위

| 구분            | 기능                                |
| ------------- | --------------------------------- |
| Backend       | Express 기반 HTTP server entrypoint |
| Backend       | `/health` endpoint                |
| Backend       | `/correction` API                 |
| Backend       | `/conversation` API               |
| Backend       | `/level-test` API                 |
| Container     | Backend Dockerfile                |
| Container     | Local Docker 실행 검증                |
| Registry      | Amazon ECR Repository             |
| CI/CD         | GitHub Actions Docker image build |
| CI/CD         | GitHub Actions ECR push           |
| Security      | Trivy image scan                  |
| Infra         | Terraform EKS Cluster             |
| Infra         | Terraform Managed NodeGroup       |
| Infra         | Terraform ECR                     |
| Infra         | Terraform IRSA                    |
| Kubernetes    | Namespace                         |
| Kubernetes    | ServiceAccount                    |
| Kubernetes    | Deployment                        |
| Kubernetes    | Service                           |
| Kubernetes    | Ingress                           |
| Ingress       | AWS Load Balancer Controller      |
| GitOps        | Argo CD 설치                        |
| GitOps        | Argo CD Application               |
| Monitoring    | Prometheus                        |
| Monitoring    | Grafana                           |
| Documentation | project-plan.md                   |
| Documentation | eks-design.md                   |
| Documentation | runbook.md                        |
| Documentation | troubleshooting.md                |
| Documentation | evidence.md                       |

### 5.2 향후 확장 범위

| 구분            | 기능                              | 설명                                        |
| ------------- | ------------------------------- | ----------------------------------------- |
| Scaling       | HPA                             | Backend Pod CPU/Memory 기준 자동 확장           |
| Scaling       | Cluster Autoscaler 또는 Karpenter | NodeGroup 자동 확장                           |
| Security      | NetworkPolicy                   | Pod 간 네트워크 접근 제한                          |
| Security      | External Secrets Operator       | AWS Secrets Manager와 Kubernetes Secret 연동 |
| Security      | cert-manager                    | HTTPS 인증서 자동 발급                           |
| Observability | Loki                            | Kubernetes 로그 수집                          |
| Observability | Custom Dashboard                | API latency, error, request count 중심 대시보드 |
| Release       | Blue/Green 또는 Canary            | 점진적 배포 전략                                 |
| Domain        | Route 53                        | ALB DNS 대신 도메인 기반 접근                      |
| Environment   | prod 환경 분리                      | dev/prod EKS 환경 분리                        |

### 5.3 현재 범위에서 제외하는 것

| 제외 항목            | 이유                                                   |
| ---------------- | ---------------------------------------------------- |
| Frontend Pod 배포  | EKS 검증의 핵심은 Backend 운영이며, 프론트엔드는 별도 정적 호스팅 구조로 유지 가능 |
| HTTPS 인증서        | dev 검증 환경에서는 ALB HTTP 접근으로 API 검증 가능                 |
| Route 53 도메인 연결  | ALB DNS로 외부 접근 검증 가능                                 |
| HPA / Autoscaler | 기본 운영 검증 후 고도화 항목으로 분리                               |
| Loki 로그 수집       | 현재는 Prometheus/Grafana metrics 검증을 우선                |
| 장기 운영            | EKS 비용이 지속적으로 발생하므로 검증 후 삭제 또는 최소화                   |
| Multi-cluster 구성 | 포트폴리오 dev 환경에서는 과도한 범위                               |

---

## 6. 요구사항 명세

### 6.1 기능 요구사항

| ID    | 요구사항                                                            | 우선순위   |
| ----- | --------------------------------------------------------------- | ------ |
| FR-01 | Backend는 Docker image로 빌드되어야 한다.                                | High   |
| FR-02 | Backend는 컨테이너 환경에서 HTTP server로 실행되어야 한다.                       | High   |
| FR-03 | `/health` API는 EKS 환경에서 정상 응답해야 한다.                             | High   |
| FR-04 | `/correction` API는 ALB Ingress를 통해 호출 가능해야 한다.                  | High   |
| FR-05 | `/conversation` API는 ALB Ingress를 통해 호출 가능해야 한다.                | High   |
| FR-06 | `/level-test` API는 ALB Ingress를 통해 호출 가능해야 한다.                  | High   |
| FR-07 | Backend Pod는 DynamoDB, SSM, Bedrock에 접근할 수 있어야 한다.              | High   |
| FR-08 | Kubernetes manifest는 Git repository에서 관리되어야 한다.                 | High   |
| FR-09 | Argo CD는 Backend Application을 `Synced` / `Healthy` 상태로 관리해야 한다. | Medium |
| FR-10 | Prometheus와 Grafana에서 Backend Pod metrics를 확인할 수 있어야 한다.        | Medium |

### 6.2 비기능 요구사항

| 구분     | 요구사항                                                              |
| ------ | ----------------------------------------------------------------- |
| 가용성    | dev 검증 환경에서 Backend Pod와 ALB Ingress가 정상 응답해야 한다.                 |
| 보안     | Pod는 AWS Access Key를 직접 사용하지 않고 IRSA를 통해 AWS 서비스에 접근해야 한다.        |
| 배포     | Docker image build, scan, push는 GitHub Actions에서 자동화되어야 한다.       |
| 배포 추적성 | Kubernetes manifest는 Git repository와 Argo CD를 통해 추적 가능해야 한다.      |
| 관측성    | Pod, Namespace, Node metrics를 Prometheus / Grafana로 확인할 수 있어야 한다. |
| 유지보수성  | Kubernetes manifest는 `deploy/k8s` 하위에서 관리되어야 한다.                  |
| 비용     | 검증이 끝나면 NodeGroup을 축소하거나 EKS 리소스를 삭제해야 한다.                        |
| 문서화    | Evidence, Troubleshooting, Runbook을 통해 구축 및 운영 과정을 설명할 수 있어야 한다.  |

---

## 7. 트래픽 및 운영 가정

이 EKS 버전은 대규모 상용 트래픽을 전제로 하지 않는다.
목적은 Kubernetes 운영 구조 검증과 포트폴리오 증거 확보이다.

| 항목            | 예상 기준                                        |
| ------------- | -------------------------------------------- |
| 초기 사용자        | 포트폴리오 검증용 소수 사용자                             |
| 일일 요청 수       | 10~100회 수준의 테스트 요청                           |
| 주요 API 요청     | health, correction, conversation, level-test |
| Backend Pod 수 | 기본 1개                                        |
| Node 수        | 검증 단계에 따라 1~3대                               |
| 트래픽 특성        | 짧은 API 요청 중심                                 |
| 운영 기간         | 구축, 검증, 캡처, 문서화 완료 시점까지                      |
| 비용 정책         | 검증 후 NodeGroup 축소 또는 destroy                 |

---

## 8. 기술 스택

| 영역             | 기술                                                      |
| -------------- | ------------------------------------------------------- |
| Backend        | Node.js, TypeScript, Express                            |
| Container      | Docker                                                  |
| Image Registry | Amazon ECR                                              |
| Orchestration  | Amazon EKS                                              |
| Kubernetes     | Deployment, Service, Ingress, ServiceAccount, Namespace |
| Load Balancing | AWS Load Balancer Controller, Application Load Balancer |
| IAM            | IRSA, IAM Role, IAM Policy                              |
| IaC            | Terraform                                               |
| CI/CD          | GitHub Actions                                          |
| Security Scan  | Trivy                                                   |
| GitOps         | Argo CD                                                 |
| Monitoring     | Prometheus, Grafana, kube-state-metrics, node-exporter  |
| AWS Services   | DynamoDB, SSM Parameter Store, Amazon Bedrock           |
| Region         | ap-northeast-2                                          |

---

## 9. 기술 선택 이유

### 9.1 Amazon EKS

Kubernetes 운영 환경을 직접 구성하고 검증하기 위해 Amazon EKS를 사용한다. EKS는 Kubernetes Control Plane을 AWS가 관리하므로, 사용자는 Worker Node, Pod 배포, Ingress, IAM 연동, 관측성 구성에 집중할 수 있다.

### 9.2 Docker

Backend 애플리케이션을 EKS에서 실행하기 위해 Docker image로 패키징한다. Dockerfile을 통해 실행 환경을 고정하고, 로컬과 EKS 간 실행 차이를 줄인다.

### 9.3 Amazon ECR

Backend Docker image를 저장하기 위해 Amazon ECR을 사용한다. GitHub Actions에서 빌드된 이미지를 ECR에 Push하고, Kubernetes Deployment는 해당 이미지를 Pull하여 Backend Pod를 실행한다.

### 9.4 GitHub Actions

GitHub Actions는 Docker image build, Trivy scan, ECR push 자동화를 담당한다. 이미지 빌드와 보안 스캔을 자동화하여 수동 배포 실수를 줄이고, 배포 이력을 GitHub Actions 로그로 남긴다.

### 9.5 Trivy

Trivy를 사용하여 Backend Docker image의 취약점을 스캔한다. 이를 통해 컨테이너 이미지 보안 점검 과정을 CI/CD 흐름에 포함한다.

### 9.6 AWS Load Balancer Controller

Kubernetes Ingress 리소스를 기반으로 AWS Application Load Balancer를 생성하기 위해 AWS Load Balancer Controller를 사용한다. 이를 통해 Kubernetes manifest로 외부 트래픽 진입점을 관리할 수 있다.

### 9.7 IRSA

Pod가 AWS 서비스에 접근할 때 장기 Access Key를 사용하지 않기 위해 IRSA를 사용한다. Backend Pod는 ServiceAccount에 연결된 IAM Role을 통해 DynamoDB, SSM Parameter Store, Bedrock에 접근한다.

### 9.8 Argo CD

Kubernetes manifest를 Git repository 기준으로 동기화하기 위해 Argo CD를 사용한다. 이를 통해 GitOps 방식의 배포 상태 관리와 `Synced` / `Healthy` 상태 검증이 가능하다.

### 9.9 Prometheus / Grafana

EKS Cluster와 Backend Pod의 metrics를 확인하기 위해 Prometheus와 Grafana를 사용한다. Prometheus는 Kubernetes metrics를 수집하고, Grafana는 Cluster, Namespace, Pod 단위 metrics를 시각화한다.

---

## 10. 아키텍처 개요

상세 아키텍처는 `docs/eks/eks-design.md`에서 관리한다.

요약 구조는 다음과 같다.

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

## 11. Kubernetes 리소스 설계 개요

### 11.1 Namespace

| 항목        | 값                          |
| --------- | -------------------------- |
| Namespace | koreanmate                 |
| 목적        | Backend Application 리소스 분리 |

### 11.2 ServiceAccount

| 항목        | 값                         |
| --------- | ------------------------- |
| Name      | backend                   |
| Namespace | koreanmate                |
| 목적        | Backend Pod에 IRSA Role 연결 |

### 11.3 Deployment

| 항목              | 값                                |
| --------------- | -------------------------------- |
| Name            | backend                          |
| Replicas        | 1                                |
| Container Port  | 3000                             |
| Image           | ECR `koreanmate-dev-backend:dev` |
| Runtime         | Node.js Express                  |
| Health Endpoint | `/health`                        |

### 11.4 Service

| 항목          | 값                                 |
| ----------- | --------------------------------- |
| Name        | backend                           |
| Type        | ClusterIP                         |
| Port        | 80                                |
| Target Port | 3000                              |
| 목적          | Ingress와 Backend Pod 사이 내부 트래픽 전달 |

### 11.5 Ingress

| 항목                | 값                            |
| ----------------- | ---------------------------- |
| Controller        | AWS Load Balancer Controller |
| Load Balancer     | Application Load Balancer    |
| Scheme            | internet-facing              |
| Target Type       | ip                           |
| Health Check Path | `/health`                    |
| 목적                | 외부 API 접근 제공                 |

---

## 12. Port 사용 계획

EKS 버전에서는 Kubernetes 내부 통신, ALB 외부 접근, 로컬 검증용 port-forward를 구분하여 사용한다.

### 12.1 애플리케이션 및 Kubernetes Port

| 구분                  | Port | 설명                                                |
| ------------------- | ---: | ------------------------------------------------- |
| Backend Container   | 3000 | Express 기반 Backend HTTP server가 컨테이너 내부에서 사용하는 포트 |
| Kubernetes Service  |   80 | Ingress 또는 port-forward가 접근하는 Backend Service 포트  |
| Service Target Port | 3000 | Service가 Backend Pod의 Container Port로 전달하는 포트     |
| ALB HTTP            |   80 | 외부 API Client가 ALB를 통해 Backend API에 접근하는 포트       |

Backend Pod는 컨테이너 내부에서 `3000`번 포트로 실행된다.
Kubernetes Service는 `80`번 포트를 열고, 실제 트래픽은 Backend Pod의 `3000`번 포트로 전달한다.

```text
ALB :80
  ↓
Ingress
  ↓
Service :80
  ↓
Backend Pod :3000
```

### 12.2 로컬 검증용 Port-forward

로컬 브라우저 또는 터미널에서 EKS 내부 리소스를 검증하기 위해 다음 port-forward를 사용했다.

| 대상              | Local Port | Cluster Port | 사용 목적                           |
| --------------- | ---------: | -----------: | ------------------------------- |
| Backend Service |       8081 |           80 | `/health` API 로컬 검증             |
| Argo CD Server  |       8082 |          443 | Argo CD Web UI 접속               |
| Prometheus      |       9090 |         9090 | Prometheus Targets 및 metrics 확인 |
| Grafana         |       3002 |           80 | Grafana Dashboard 접속            |

사용 예시는 다음과 같다.

```bash
kubectl port-forward -n koreanmate service/backend 8081:80
kubectl port-forward svc/argocd-server -n argocd 8082:443
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
kubectl port-forward -n monitoring svc/monitoring-grafana 3002:80
```

로컬 검증용 포트는 운영 트래픽용 포트가 아니라, EKS 내부 리소스를 브라우저나 터미널에서 확인하기 위한 임시 접속 포트이다.

### 12.3 Port 사용 원칙

| 원칙    | 설명                                                                      |
| ----- | ----------------------------------------------------------------------- |
| 운영 접근 | 외부 API 접근은 ALB DNS와 HTTP 80 포트를 사용한다.                                   |
| 내부 통신 | Kubernetes 내부에서는 Service 80 → Pod 3000 구조를 사용한다.                        |
| 로컬 검증 | Backend, Argo CD, Prometheus, Grafana는 각각 다른 local port를 사용하여 충돌을 방지한다. |
| 문서화   | Evidence와 Troubleshooting에서 사용한 port-forward 포트는 캡처 기준과 함께 기록한다.        |

이번 EKS 검증에서는 여러 도구를 동시에 확인해야 했기 때문에 port-forward 포트를 명확히 분리했다. 이를 통해 Backend API, Argo CD UI, Prometheus, Grafana를 동시에 검증할 수 있었다.

---

## 13. 보안 요구사항

| 항목                | 설계                                                    |
| ----------------- | ----------------------------------------------------- |
| Image 보안          | GitHub Actions에서 Trivy image scan 수행                  |
| Registry 접근       | ECR에 Backend image 저장                                 |
| Pod AWS 권한        | Backend Pod IRSA Role 사용                              |
| ALB 권한            | AWS Load Balancer Controller IRSA Role 사용             |
| 권한 범위             | Backend Pod는 필요한 DynamoDB, SSM, Bedrock 권한만 부여        |
| Access Key 관리     | Pod 내부에 장기 AWS Access Key 저장하지 않음                     |
| ServiceAccount 분리 | Backend 전용 ServiceAccount 사용                          |
| GitOps 관리         | Kubernetes manifest를 Git 기준으로 관리                      |
| Secret 관리         | 민감 값은 향후 Kubernetes Secret 또는 External Secrets로 분리 예정 |

---

## 14. 비용 최적화 전략

EKS는 사용량이 적더라도 클러스터와 NodeGroup이 존재하는 동안 비용이 발생한다.
따라서 이 프로젝트는 상시 운영보다 검증과 증거 확보를 목적으로 한다.

| 항목                | 전략                          |
| ----------------- | --------------------------- |
| EKS Control Plane | 검증 완료 후 destroy 대상          |
| Worker Node       | 검증 단계에 따라 1~3대로 임시 확장       |
| ALB               | Ingress 검증 후 destroy 대상     |
| Monitoring Stack  | 캡처 완료 후 삭제 가능               |
| EBS Volume        | destroy 후 잔여 volume 확인      |
| CloudWatch Logs   | 필요 이상 로그 출력 최소화             |
| NAT Gateway       | 비용 절감을 위해 기본 구성에서 제외 또는 최소화 |

비용 관리 원칙:

```text
1. Backend 기본 검증은 최소 NodeGroup으로 수행
2. Argo CD / Monitoring 검증 시에만 NodeGroup 임시 확장
3. 캡처와 문서화 완료 후 NodeGroup 축소 또는 terraform destroy
```

---

## 15. 운영 및 모니터링 전략

| 도구             | 목적                                          |
| -------------- | ------------------------------------------- |
| kubectl        | Pod, Service, Ingress, Event 확인             |
| Argo CD        | Application Synced / Healthy 상태 확인          |
| Prometheus     | Kubernetes metrics 수집                       |
| Grafana        | Cluster, Namespace, Backend Pod metrics 시각화 |
| AWS Console    | ALB, Target Group, ECR, IAM Role 확인         |
| Terraform      | EKS 리소스 변경 및 destroy                        |
| GitHub Actions | Image build, scan, push 이력 확인               |

주요 확인 지표:

| 영역         | 확인 항목                                    |
| ---------- | ---------------------------------------- |
| Node       | Ready 상태, Pod capacity, CPU/Memory       |
| Pod        | Running, Restart count, logs             |
| Service    | Endpoint 존재 여부                           |
| Ingress    | ALB DNS 생성 여부, Target health             |
| Argo CD    | Synced, Healthy                          |
| Prometheus | Targets UP                               |
| Grafana    | Backend Pod CPU, Memory, Network metrics |

---

## 16. CI/CD 및 GitOps 전략

### 16.1 Image Build Pipeline

GitHub Actions는 Backend Docker image를 빌드하고, Trivy scan 후 ECR에 Push한다.

| 단계           | 역할                         |
| ------------ | -------------------------- |
| Checkout     | GitHub source checkout     |
| AWS Auth     | GitHub OIDC 또는 AWS 인증 설정   |
| ECR Login    | Amazon ECR login           |
| Docker Build | Backend Docker image build |
| Trivy Scan   | Image vulnerability scan   |
| Docker Push  | ECR에 image push            |

### 16.2 Kubernetes 배포 전략

Kubernetes manifest는 Git repository의 `deploy/k8s/backend` 경로에서 관리한다.

Argo CD Application은 다음 정보를 기준으로 동기화한다.

| 항목              | 값                          |
| --------------- | -------------------------- |
| Repository      | GitHub Repository          |
| Target Revision | eks                        |
| Path            | deploy/k8s/backend         |
| Destination     | in-cluster                 |
| Namespace       | koreanmate                 |
| Sync Policy     | Automated, Prune, SelfHeal |

---

## 17. WBS 및 일정 계획

| 단계 | 구분            | 주요 작업                                    | 산출물                       |
| -- | ------------- | ---------------------------------------- | ------------------------- |
| 1  | 준비            | EKS branch 생성 및 Serverless 코드 보호 기준 정리   | eks branch                |
| 2  | Backend       | Express 기반 HTTP server entrypoint 추가     | `src/server`              |
| 3  | Backend       | Local HTTP server 실행 검증                  | `/health` 응답              |
| 4  | Container     | Backend Dockerfile 작성                    | `backend.Dockerfile`      |
| 5  | Container     | Local Docker 실행 검증                       | Docker container          |
| 6  | Registry      | ECR Terraform module 작성                  | ECR Repository            |
| 7  | CI/CD         | GitHub Actions image build / push 구성     | `eks-image-build.yml`     |
| 8  | Security      | Trivy image scan 추가                      | Trivy scan log            |
| 9  | Infra         | EKS Terraform base structure 작성          | EKS env/module            |
| 10 | Infra         | VPC, EKS Cluster, NodeGroup 생성           | EKS Cluster               |
| 11 | Ingress       | AWS Load Balancer Controller 설치          | Controller Pod            |
| 12 | IAM           | ALB Controller IRSA 구성                   | IAM Role / ServiceAccount |
| 13 | IAM           | Backend Pod IRSA 구성                      | Backend IAM Role          |
| 14 | Kubernetes    | Namespace, ServiceAccount, Deployment 작성 | K8s manifest              |
| 15 | Kubernetes    | Service, Ingress 작성                      | ALB Ingress               |
| 16 | 검증            | Backend Pod 배포 및 Service health 확인       | `/health` success         |
| 17 | 검증            | ALB Ingress 외부 API 호출 검증                 | API success               |
| 18 | GitOps        | Argo CD 설치                               | Argo CD Pods              |
| 19 | GitOps        | Argo CD Application 구성                   | Synced / Healthy          |
| 20 | Observability | Prometheus / Grafana 설치                  | Monitoring Stack          |
| 21 | Observability | Prometheus Targets / Grafana metrics 확인  | Dashboard capture         |
| 22 | 문서화           | Evidence 작성                              | `evidence.md`             |
| 23 | 문서화           | Troubleshooting 작성                       | `troubleshooting.md`      |
| 24 | 문서화           | Runbook 작성                               | `runbook.md`              |
| 25 | 문서화           | Architecture 작성                          | `eks-design.md`         |
| 26 | 비용 관리         | NodeGroup 축소 또는 Terraform destroy        | Cost control              |

---

## 18. 주요 리스크와 대응 방안

| 리스크                  | 영향                               | 대응 방안                                               |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| EKS 비용 증가            | 예상보다 높은 비용 발생                    | 검증 후 NodeGroup 축소 또는 terraform destroy              |
| Node Pod capacity 부족 | Argo CD / Monitoring Pod Pending | NodeGroup 임시 확장                                     |
| 환경변수 누락              | Backend Pod CrashLoopBackOff     | Deployment env 검증                                   |
| ECR image tag 오류     | 이전 이미지 배포 또는 ImagePullBackOff    | GitHub Actions와 ECR digest 확인                       |
| IRSA 권한 오류           | DynamoDB / Bedrock / SSM 접근 실패   | ServiceAccount annotation과 IAM Trust Policy 확인      |
| ALB 생성 실패            | 외부 API 접근 불가                     | AWS Load Balancer Controller log와 Ingress Events 확인 |
| Argo CD OutOfSync    | Git과 Cluster 상태 불일치              | Application diff 확인 후 Sync                          |
| Prometheus Pending   | Monitoring 검증 불가                 | NodeGroup 임시 확장 또는 resource request 조정              |
| 로컬 port-forward 혼동   | Grafana / Prometheus 접속 실패       | 포트별 터미널 분리 및 URL 확인                                 |
| 잔여 리소스               | destroy 후 비용 지속                  | ALB, EBS, EKS Cluster 잔여 리소스 확인                     |

---

## 19. 현재 한계와 개선 방향

현재 EKS 버전은 포트폴리오 검증용 `dev` 환경 기준으로 설계되어 있다. 운영 수준으로 확장하려면 다음 개선이 필요하다.

| 항목           | 현재 상태              | 개선 방향                                    |
| ------------ | ------------------ | ---------------------------------------- |
| HTTPS        | ALB HTTP 기반 검증     | ACM + Ingress HTTPS 구성                   |
| Domain       | ALB DNS 직접 사용      | Route 53 도메인 연결                          |
| Scaling      | Replica 1개         | HPA 추가                                   |
| Node Scaling | 수동 NodeGroup 조정    | Cluster Autoscaler 또는 Karpenter          |
| Secret 관리    | Deployment env 중심  | External Secrets Operator 적용             |
| Logging      | kubectl logs 중심    | Loki 또는 CloudWatch Container Insights 검토 |
| 배포 전략        | Rolling Update 기본  | Blue/Green 또는 Canary 검토                  |
| 보안 정책        | 기본 Kubernetes 네트워크 | NetworkPolicy 적용                         |
| 비용 관리        | 수동 destroy         | TTL 기반 자동 삭제 또는 별도 cleanup workflow      |
| 환경 분리        | dev 중심             | prod 환경 분리                               |

---

## 20. 최종 산출물

| 문서                            | 목적                                           |
| ----------------------------- | -------------------------------------------- |
| `docs/overview.md`            | Serverless 버전과 EKS 버전의 관계, 목적, 비교 정리         |
| `docs/eks/project-plan.md`    | EKS 버전의 목적, 범위, 요구사항, 일정, 리스크 정리             |
| `docs/eks/eks-design.md`    | EKS 아키텍처, 요청 흐름, GitOps, IRSA, Monitoring 설계 |
| `docs/eks/runbook.md`         | 운영 중 장애 상황별 확인 절차와 복구 방법 정리                  |
| `docs/eks/troubleshooting.md` | 실제 문제, 원인, 해결 과정, 배운 점 정리                    |
| `docs/eks/evidence.md`        | EKS 구축 및 검증 캡처 정리                            |
| `deploy/k8s/backend/`         | Backend Kubernetes manifest                  |
| `deploy/k8s/argocd/`          | Argo CD Application manifest                 |
| `deploy/k8s/monitoring/`      | Prometheus / Grafana values 파일               |

---

## 21. 프로젝트의 핵심 차별점

KoreanMate EKS 버전의 핵심 차별점은 다음과 같다.

* 기존 Backend를 Express 기반 HTTP server로 확장하여 컨테이너 환경에서 실행했다.
* Dockerfile을 작성하고 로컬 Docker 실행을 먼저 검증했다.
* GitHub Actions에서 Docker image build, Trivy scan, ECR push를 자동화했다.
* Terraform으로 ECR, EKS Cluster, NodeGroup, IRSA를 구성했다.
* AWS Load Balancer Controller를 사용하여 Kubernetes Ingress에서 ALB를 생성했다.
* Backend Pod가 AWS Access Key 없이 IRSA로 DynamoDB, SSM, Bedrock에 접근하도록 구성했다.
* Argo CD를 사용하여 GitOps 방식의 Kubernetes 배포를 검증했다.
* Prometheus와 Grafana로 `koreanmate` namespace와 Backend Pod metrics를 확인했다.
* Trivy 이미지 스캔을 통해 컨테이너 보안 검증 과정을 포함했다.
* EKS 비용 구조를 고려하여 검증 후 NodeGroup 축소 또는 destroy 전략을 문서화했다.
* Evidence, Troubleshooting, Runbook을 통해 구축 과정과 운영 대응을 문서화했다.
