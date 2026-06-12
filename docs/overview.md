# KoreanMate Project Overview

> 목적: KoreanMate 프로젝트의 전체 구조와 Serverless 버전, EKS 버전의 관계를 정리한다.
> 기준 환경: AWS Seoul Region `ap-northeast-2`, Terraform 기반 IaC

---

## 1. 프로젝트 개요

KoreanMate는 한국어를 학습하는 외국인 사용자를 대상으로 하는 AI 기반 한국어 학습 웹 애플리케이션이다.

사용자는 다음 기능을 사용할 수 있다.

* 한국어 글쓰기 교정
* 상황별 한국어 회화 생성
* 한국어 레벨 테스트
* 사용자별 학습 기록 조회
* 일일 AI 사용량 확인

이 프로젝트의 목적은 단순히 AI 기능을 구현하는 것이 아니라, 실제 클라우드 운영 관점에서 다음 역량을 보여주는 것이다.

* AWS 기반 애플리케이션 아키텍처 설계
* Terraform 기반 IaC 구성
* 인증/인가 설계
* AI API 사용량 제한과 비용 관리
* CI/CD 자동화
* 보안 스캔과 IAM 권한 관리
* 운영 모니터링과 장애 대응 문서화
* Kubernetes 기반 확장 운영 환경 검증

KoreanMate는 두 가지 운영 버전으로 구성한다.

```text
KoreanMate
├── Serverless Version
│   └── 메인 운영 버전
│
└── EKS Version
    └── Kubernetes 운영 역량 검증 버전
```

---

## 2. 버전 구성 목적

KoreanMate는 하나의 기능 서비스를 두 가지 인프라 방식으로 검증한다.

| 버전                 | 목적                                                                          |
| ------------------ | --------------------------------------------------------------------------- |
| Serverless Version | 비용 최적화, 관리형 서비스 활용, 인증/보안, AI 사용량 제한, 기본 운영성을 보여주는 메인 버전                    |
| EKS Version        | Kubernetes 배포, GitOps, 컨테이너 보안, IRSA, Prometheus/Grafana 관측성을 보여주는 확장 검증 버전 |

두 버전은 경쟁 관계가 아니다.

Serverless 버전은 실제로 계속 유지할 수 있는 비용 효율적인 메인 서비스이고, EKS 버전은 Kubernetes 운영 환경을 직접 구축하고 검증할 수 있다는 증거를 남기기 위한 확장 버전이다.

---

## 3. Serverless Version 개요

Serverless 버전은 KoreanMate의 메인 운영 버전이다.

사용량이 적은 개인 포트폴리오 서비스에서는 항상 서버를 켜두는 구조보다, 요청이 있을 때만 비용이 발생하는 Serverless 구조가 더 적합하다.

Serverless 버전의 주요 구성은 다음과 같다.

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

운영 구성은 다음과 같다.

```text
Operations
  ↓
CloudWatch Logs / Metrics
  ↓
X-Ray
  ↓
Grafana Cloud
  ↓
CloudTrail
  ↓
AWS Budgets
  ↓
SNS Email Notification
```

Serverless 버전에서 보여주는 핵심 역량은 다음과 같다.

| 영역              | 내용                                 |
| --------------- | ---------------------------------- |
| Hosting         | S3 + CloudFront 기반 정적 웹 호스팅        |
| API             | API Gateway HTTP API + Lambda      |
| Auth            | Cognito User Pool + JWT Authorizer |
| Data            | DynamoDB 기반 사용자별 학습 기록 저장          |
| AI              | Amazon Bedrock 기반 AI 응답 생성         |
| Cost Control    | 사용자별 일일 사용량 제한, AWS Budgets        |
| Security        | IAM, KMS, WAF, CloudTrail, S3 OAC  |
| Observability   | CloudWatch, X-Ray, Grafana Cloud   |
| CI/CD           | GitHub Actions, Terraform          |
| Deploy Security | GitHub OIDC + IAM Deploy Role      |

---

## 4. EKS Version 개요

EKS 버전은 KoreanMate Backend를 Kubernetes 환경에서 운영할 수 있도록 확장한 검증 버전이다.

기존 Backend 기능을 새로 만드는 것이 아니라, Backend를 Docker image로 패키징하고 EKS에 배포하여 Kubernetes 운영 흐름을 검증한다.

EKS 버전의 주요 구성은 다음과 같다.

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

배포 흐름은 다음과 같다.

```text
Developer
  ↓
GitHub Push
  ↓
GitHub Actions
  ↓
Docker Build
  ↓
Trivy Image Scan
  ↓
Amazon ECR Push
  ↓
Argo CD
  ↓
EKS Backend Deployment
```

관측성 흐름은 다음과 같다.

```text
EKS Cluster
  ↓
Prometheus
  ↓
Grafana
  ↓
Cluster / Namespace / Backend Pod Metrics
```

EKS 버전에서 보여주는 핵심 역량은 다음과 같다.

| 영역            | 내용                                           |
| ------------- | -------------------------------------------- |
| Container     | Docker 기반 Backend 컨테이너화                      |
| Registry      | Amazon ECR image 저장                          |
| Kubernetes    | Deployment, Service, Ingress, ServiceAccount |
| Ingress       | AWS Load Balancer Controller 기반 ALB 연동       |
| IAM           | IRSA 기반 Pod 단위 AWS 권한 제어                     |
| GitOps        | Argo CD Application Synced / Healthy 검증      |
| Security      | Trivy image scan                             |
| Observability | Prometheus / Grafana 기반 Pod metrics 확인       |
| IaC           | Terraform 기반 EKS, NodeGroup, IRSA 구성         |
| Cost Control  | 검증 후 NodeGroup 축소 또는 destroy                 |

---

## 5. Serverless와 EKS의 역할 차이

| 항목            | Serverless Version                 | EKS Version                     |
| ------------- | ---------------------------------- | ------------------------------- |
| 역할            | 메인 운영 버전                           | Kubernetes 운영 검증 버전             |
| 목적            | 비용 효율적인 AI 학습 서비스 운영               | 컨테이너/Kubernetes 운영 역량 증명        |
| Compute       | AWS Lambda                         | EKS Worker Node + Backend Pod   |
| API 진입점       | API Gateway HTTP API               | ALB Ingress                     |
| Frontend      | S3 + CloudFront                    | EKS 범위에서 제외                     |
| Backend 실행 방식 | Function 단위 실행                     | HTTP Server 컨테이너 실행             |
| 배포 방식         | GitHub Actions + Terraform         | GitHub Actions + ECR + Argo CD  |
| 인증            | Cognito JWT Authorizer             | EKS API 검증 기준에서는 Backend API 중심 |
| AWS 권한        | Lambda Execution Role              | IRSA 기반 Pod IAM Role            |
| 관측성           | CloudWatch / X-Ray / Grafana Cloud | Prometheus / Grafana            |
| 보안 검증         | Trivy IaC / Filesystem Scan        | Trivy Image Scan                |
| 비용 특성         | 요청 기반 비용 중심                        | Cluster, Node, ALB 지속 비용 발생     |
| 유지 전략         | 계속 유지 가능                           | 검증 후 삭제 또는 최소화                  |

---

## 6. 왜 Serverless를 메인으로 유지하는가

KoreanMate는 초기 포트폴리오 서비스이며, 대규모 상용 트래픽을 전제로 하지 않는다.

따라서 메인 운영 버전은 Serverless가 더 적합하다.

Serverless를 메인으로 유지하는 이유는 다음과 같다.

| 이유         | 설명                                                            |
| ---------- | ------------------------------------------------------------- |
| 비용 효율성     | 요청이 적을 때 Lambda, API Gateway, DynamoDB On-demand는 고정비 부담이 낮다. |
| 운영 부담 감소   | 서버 패치, 노드 관리, 오토스케일링 운영 부담이 적다.                               |
| 관리형 서비스 활용 | Cognito, DynamoDB, S3, CloudFront를 활용해 운영 복잡도를 줄일 수 있다.       |
| 포트폴리오 설명력  | 비용 최적화, 인증, 보안, 관측성, CI/CD를 균형 있게 보여줄 수 있다.                   |
| 지속 운영 가능성  | 개인 포트폴리오 서비스로 계속 유지하기에 적합하다.                                  |

---

## 7. 왜 EKS 버전을 별도로 만드는가

Serverless만으로는 Kubernetes 운영 역량을 보여주기 어렵다.

DevOps / Cloud Engineer 포트폴리오에서는 다음 역량도 중요하다.

* 컨테이너 이미지 빌드와 배포
* Kubernetes Deployment / Service / Ingress 이해
* ALB Ingress Controller 운영
* Pod 단위 IAM 권한 제어
* GitOps 기반 배포 관리
* 컨테이너 이미지 보안 스캔
* Prometheus / Grafana 기반 관측성
* Node capacity와 비용 관리

EKS 버전은 이 역량을 보여주기 위한 별도 확장 버전이다.

다만 EKS는 클러스터와 NodeGroup이 존재하는 동안 비용이 계속 발생한다.
따라서 상시 운영보다는 다음 흐름으로 관리한다.

```text
EKS 구축
  ↓
Backend 배포
  ↓
ALB API 검증
  ↓
Argo CD GitOps 검증
  ↓
Prometheus / Grafana 관측성 검증
  ↓
Evidence 캡처
  ↓
문서화
  ↓
NodeGroup 축소 또는 terraform destroy
```

---

## 8. 공통 애플리케이션 기능

두 버전은 인프라 구조는 다르지만, 핵심 Backend 기능은 동일한 KoreanMate 서비스를 기반으로 한다.

| 기능           | 설명                              |
| ------------ | ------------------------------- |
| Correction   | 사용자가 입력한 한국어 문장을 AI가 교정한다.      |
| Conversation | 사용자가 입력한 상황을 기반으로 한국어 회화를 생성한다. |
| Level Test   | 사용자의 한국어 입력을 기반으로 학습 수준을 평가한다.  |
| History      | 사용자별 학습 기록을 저장하고 조회한다.          |
| Usage        | 사용자별 일일 AI 사용량을 제한하고 조회한다.      |

Serverless 버전에서는 위 기능이 Lambda로 실행된다.

EKS 버전에서는 위 기능 중 주요 API를 Express 기반 Backend Pod에서 실행한다.

---

## 9. 공통 AWS 서비스

두 버전 모두 일부 AWS 서비스를 공통으로 사용한다.

| AWS 서비스             | 사용 목적                    |
| ------------------- | ------------------------ |
| Amazon Bedrock      | AI 응답 생성                 |
| DynamoDB            | 학습 기록, 사용량, 사용자 프로필 저장   |
| SSM Parameter Store | Bedrock Model ID 등 설정 관리 |
| IAM                 | AWS 서비스 접근 권한 제어         |
| CloudWatch          | 로그와 기본 운영 지표 확인          |
| Terraform           | 인프라 리소스 코드화              |

차이는 실행 환경이다.

```text
Serverless
→ Lambda Execution Role이 AWS 서비스에 접근

EKS
→ Backend Pod가 IRSA Role을 통해 AWS 서비스에 접근
```

---

## 10. Repository 구조

권장 구조는 다음과 같다.

```text
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
    ├── evidence.md
    └── images/

deploy/
└── k8s/
    ├── backend/
    │   ├── namespace.yaml
    │   ├── service-account.yaml
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── ingress.yaml
    │
    ├── argocd/
    │   └── backend-application.yaml
    │
    └── monitoring/
        └── values.yaml

infra/
├── serverless/
└── eks/
```

---

## 11. 문서 구성

| 문서                                   | 목적                                      |
| ------------------------------------ | --------------------------------------- |
| `docs/overview.md`                   | Serverless 버전과 EKS 버전의 관계, 목적, 역할 차이 정리 |
| `docs/serverless/project-plan.md`    | Serverless 버전의 목적, 요구사항, 범위, 일정 정리      |
| `docs/serverless/architecture.md`    | Serverless 아키텍처, 요청 흐름, 보안, 비용, 관측성 설계  |
| `docs/serverless/runbook.md`         | Serverless 운영 장애 대응 절차                  |
| `docs/serverless/troubleshooting.md` | Serverless 구축 중 실제 문제와 해결 과정            |
| `docs/serverless/evidence.md`        | Serverless 검증 캡처 정리                     |
| `docs/eks/project-plan.md`           | EKS 버전의 목적, 요구사항, 범위, 일정 정리             |
| `docs/eks/architecture.md`           | EKS 아키텍처, GitOps, IRSA, Monitoring 설계   |
| `docs/eks/runbook.md`                | EKS 운영 장애 대응 절차                         |
| `docs/eks/troubleshooting.md`        | EKS 구축 중 실제 문제와 해결 과정                   |
| `docs/eks/evidence.md`               | EKS 검증 캡처 정리                            |

---

## 12. 최종 포트폴리오 설명 방향

면접이나 README에서 KoreanMate를 설명할 때는 다음 흐름이 가장 자연스럽다.

```text
1. KoreanMate는 한국어 학습자를 위한 AI 학습 보조 서비스다.
2. 메인 운영 버전은 비용 효율적인 AWS Serverless 구조로 만들었다.
3. Cognito, DynamoDB, Bedrock, CloudWatch, WAF, Budgets, SNS를 활용해 운영성을 고려했다.
4. 추가로 EKS 버전을 만들어 같은 Backend를 Kubernetes 환경에 배포했다.
5. EKS 버전에서는 Docker, ECR, ALB Ingress, IRSA, Argo CD, Prometheus/Grafana, Trivy를 검증했다.
6. EKS는 비용이 지속적으로 발생하므로 검증과 문서화 후 삭제 또는 최소화하는 전략을 사용했다.
```

핵심 메시지는 다음과 같다.

```text
Serverless 버전은 비용 최적화된 메인 운영 서비스이고,
EKS 버전은 Kubernetes 운영 역량을 증명하기 위한 확장 검증 환경이다.
```

---

## 13. 프로젝트의 핵심 차별점

KoreanMate 프로젝트의 핵심 차별점은 다음과 같다.

* 하나의 AI 학습 서비스를 Serverless와 EKS 두 가지 운영 방식으로 검증했다.
* Serverless 버전에서는 비용 최적화와 관리형 서비스 운영 설계를 보여준다.
* EKS 버전에서는 Kubernetes, GitOps, 컨테이너 보안, 관측성을 보여준다.
* 사용자별 AI 사용량 제한을 직접 구현하여 Bedrock 비용 증가를 제어했다.
* Cognito JWT `sub` 기반으로 사용자 데이터를 분리했다.
* Terraform으로 주요 AWS 리소스를 코드화했다.
* GitHub Actions를 통해 CI/CD와 이미지 배포를 자동화했다.
* GitHub OIDC와 IRSA를 사용해 장기 AWS Access Key 사용을 줄였다.
* Trivy 보안 스캔을 CI/CD 흐름에 포함했다.
* Runbook, Troubleshooting, Evidence 문서를 통해 운영 대응과 검증 과정을 문서화했다.

---

## 14. 운영 및 비용 관리 원칙

KoreanMate는 포트폴리오 프로젝트이지만 실제 운영 관점의 비용 관리 원칙을 적용한다.

| 항목              | 원칙                                 |
| --------------- | ---------------------------------- |
| Serverless      | 메인 운영 버전으로 유지 가능                   |
| EKS             | 검증 완료 후 NodeGroup 축소 또는 destroy    |
| Bedrock         | 사용자별 일일 사용량 제한 적용                  |
| CloudWatch Logs | 필요한 로그만 남기고 retention 설정           |
| Monitoring      | Grafana/Prometheus는 EKS 검증 후 삭제 가능 |
| ALB             | EKS 검증 후 삭제 대상                     |
| Evidence        | 리소스 삭제 전 캡처와 문서화 완료                |

EKS 비용 관리 흐름은 다음과 같다.

```text
1. EKS Cluster 생성
2. Backend 배포 검증
3. Argo CD / Monitoring 검증
4. Evidence 캡처
5. 문서화
6. NodeGroup 축소 또는 terraform destroy
```

---

## 15. Overview Summary

```text
KoreanMate는 AI 기반 한국어 학습 서비스를 AWS에서 운영하는 포트폴리오 프로젝트다.

Serverless 버전은 메인 운영 버전으로, 비용 최적화와 관리형 서비스 기반 운영 설계를 보여준다.

EKS 버전은 확장 검증 버전으로, Kubernetes 배포, GitOps, 컨테이너 보안, IRSA, Prometheus/Grafana 관측성을 보여준다.

두 버전은 서로 대체 관계가 아니라, 같은 서비스를 서로 다른 운영 방식으로 검증하는 구조다.
```
