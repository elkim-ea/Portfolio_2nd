# KoreanMate

KoreanMate는 한국어 학습자를 위한 AI 기반 한국어 학습 웹 애플리케이션입니다. 사용자는 한국어 글쓰기 교정, 상황별 회화 생성, 레벨 테스트 기능을 사용할 수 있으며, AI 응답 결과와 사용량 정보는 사용자별로 저장됩니다.

이 프로젝트는 단순한 AI 웹앱 구현보다 **AWS Serverless 기반 운영 구조**, **비용 제어**, **인증/인가**, **관측성**, **CI/CD 자동화**, **Terraform 기반 IaC**를 포트폴리오 수준으로 설계하고 구현하는 것을 목표로 합니다.

---

## 주요 기능

* 한국어 글쓰기 교정
* 상황별 한국어 회화 생성
* 한국어 레벨 테스트
* 사용자별 학습 기록 조회
* 일일 AI 사용량 확인
* 사용자별 일일 사용량 제한
* Cognito 기반 회원가입 / 로그인
* CloudFront 기반 프론트엔드 배포
* GitHub Actions 기반 CI/CD

---

## 기술 스택

| 영역            | 기술                                    |
| ------------- | ------------------------------------- |
| Frontend      | React, Vite, TypeScript, Tailwind CSS |
| Backend       | Node.js, TypeScript, AWS Lambda       |
| API           | Amazon API Gateway HTTP API           |
| Auth          | Amazon Cognito, JWT Authorizer        |
| AI            | Amazon Bedrock                        |
| Database      | Amazon DynamoDB                       |
| Hosting       | Amazon S3, Amazon CloudFront          |
| Config        | AWS SSM Parameter Store               |
| Security      | IAM, KMS, WAF, Trivy                  |
| Observability | CloudWatch, X-Ray, Grafana Cloud      |
| Audit         | CloudTrail                            |
| Cost          | AWS Budgets, Usage Limit              |
| IaC           | Terraform                             |
| CI/CD         | GitHub Actions                        |

---

## Architecture Overview

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
  ├── correction
  ├── conversation
  ├── level-test
  ├── profile
  ├── history
  └── usage
        ↓
    DynamoDB
    ├── LearningRecords
    ├── UsageLimits
    └── UserProfiles

Lambda
  ↓
Amazon Bedrock

Operations
  ↓
CloudWatch / X-Ray / Grafana / CloudTrail / Budgets
```

---

## 설계 포인트

### 1. Serverless 아키텍처

초기 포트폴리오 서비스는 상시 트래픽이 많지 않기 때문에 EC2나 EKS보다 Serverless 구조가 적합하다고 판단했습니다. API Gateway, Lambda, DynamoDB, S3, CloudFront를 사용하여 서버 운영 부담을 줄이고, 요청이 있을 때만 비용이 발생하는 구조로 설계했습니다.

### 2. S3 + CloudFront 프론트엔드 배포

React/Vite 애플리케이션은 정적 파일로 빌드되므로 S3에 업로드하고 CloudFront를 통해 배포했습니다. S3는 직접 공개하지 않고 CloudFront OAC를 통해서만 접근하도록 구성하여 보안성을 높였습니다.

### 3. Cognito JWT Authorizer

회원가입과 로그인은 Amazon Cognito를 사용했습니다. API Gateway JWT Authorizer가 Cognito JWT를 검증하고, Lambda는 검증된 JWT claims의 `sub` 값을 userId로 사용합니다. 이를 통해 클라이언트가 임의로 userId를 전달하는 구조를 피하고 사용자별 데이터를 분리했습니다.

### 4. DynamoDB 데이터 모델링

사용자별 학습 기록, 사용량, 프로필을 분리하여 관리하기 위해 DynamoDB 테이블을 세 개로 구성했습니다.

| 테이블             | 역할             |
| --------------- | -------------- |
| LearningRecords | AI 학습 결과 저장    |
| UsageLimits     | 사용자별 일일 사용량 제한 |
| UserProfiles    | 사용자 학습 설정 저장   |

주요 조회 패턴이 “내 학습 기록”, “내 오늘 사용량”, “내 프로필”이므로 Cognito `sub`를 userId로 사용했습니다.

### 5. AI 호출 비용 제어

Amazon Bedrock은 호출량에 따라 비용이 증가하므로 Bedrock 호출 전에 UsageLimits 테이블에서 사용자별 일일 사용량을 확인합니다. 한도를 초과한 요청은 Bedrock을 호출하지 않고 429 응답을 반환합니다.

### 6. 운영 및 관측성

CloudWatch Logs와 Alarm을 통해 Lambda 및 API Gateway 오류를 확인할 수 있도록 구성했습니다. X-Ray는 Lambda 호출 추적에 사용하고, Grafana Cloud는 CloudWatch 지표를 시각화하기 위한 용도로 연동했습니다. CloudTrail은 AWS API 호출 이력 감사를 위해 사용했습니다.

### 7. CI/CD 분리

GitHub Actions는 CI Pipeline과 Deploy Pipeline으로 분리했습니다. CI는 빌드, 타입 체크, Terraform validate, Trivy scan을 수행하고, Deploy는 수동 실행 방식으로 Terraform apply, S3 업로드, CloudFront 캐시 무효화를 수행합니다.

---

## 비용 최적화 전략

| 항목         | 전략                           |
| ---------- | ---------------------------- |
| Compute    | Lambda 사용으로 요청 시에만 비용 발생     |
| Frontend   | S3 + CloudFront 기반 정적 배포     |
| Database   | DynamoDB PAY_PER_REQUEST     |
| AI Cost    | 사용자별 일일 사용량 제한               |
| Logs       | CloudWatch Logs Retention 설정 |
| Audit Logs | CloudTrail S3 Lifecycle 적용   |
| Budget     | AWS Budgets로 비용 알림 구성        |

---

## 보안 설계

| 항목       | 설계                                      |
| -------- | --------------------------------------- |
| 사용자 인증   | Amazon Cognito                          |
| API 보호   | API Gateway JWT Authorizer              |
| 사용자 식별   | Cognito `sub` 기반 userId                 |
| 프론트엔드 보호 | S3 Public Access Block + CloudFront OAC |
| Edge 보안  | CloudFront WAF                          |
| 권한 관리    | Lambda IAM Role                         |
| 환경변수 암호화 | KMS                                     |
| 설정 관리    | SSM Parameter Store                     |
| 감사 로그    | CloudTrail                              |
| 보안 스캔    | Trivy                                   |

---

## 구현 상태

| 영역                                         | 상태    |
| ------------------------------------------ | ----- |
| Frontend 주요 페이지                            | 완료    |
| Correction / Conversation / Level Test API | 완료    |
| Profile / History / Usage API              | 완료    |
| Cognito 인증                                 | 완료    |
| API Gateway JWT Authorizer                 | 완료    |
| DynamoDB 테이블 구성                            | 완료    |
| S3 + CloudFront 배포                         | 완료    |
| SSM Parameter Store                        | 완료    |
| KMS                                        | 완료    |
| WAF                                        | 완료    |
| CloudTrail                                 | 완료    |
| AWS Budgets                                | 완료    |
| CloudWatch Alarm                           | 완료    |
| GitHub Actions CI/CD                       | 완료    |
| Trivy Scan                                 | 완료    |
| Grafana Cloud 연동                           | 부분 완료 |
| Troubleshooting 문서                         | 진행 예정 |
| Runbook 문서                                 | 진행 예정 |

---

## 문서 구성

| 문서                          | 설명                                     |
| --------------------------- | -------------------------------------- |
| `docs/project-plan.md`      | 프로젝트 목적, 문제 정의, 요구사항, 일정, 범위 정리        |
| `docs/serverless-design.md` | Serverless 아키텍처, 요청 흐름, 보안, 비용, 관측성 설계 |
| `docs/troubleshooting.md`   | 주요 문제, 원인, 해결 과정 정리                    |
| `docs/runbook.md`           | 장애 대응 절차 정리                            |

---

## 프로젝트에서 보여주려는 역량

* AWS Serverless 아키텍처 설계
* Terraform 기반 IaC 구성
* Cognito 기반 인증/인가 설계
* API Gateway + Lambda 백엔드 구성
* DynamoDB 데이터 모델링
* Amazon Bedrock 기반 AI 기능 구현
* AI API 사용량 제한 및 비용 제어
* CloudWatch / X-Ray / CloudTrail / Grafana 기반 운영 설계
* GitHub Actions 기반 CI/CD 자동화
* Trivy 기반 보안 스캔
* 장애 대응 및 트러블슈팅 문서화

---

## 한계 및 개선 예정

현재 구조는 포트폴리오용 `dev` 환경 기준으로 설계되어 있습니다. 운영 수준으로 확장하려면 다음 개선이 필요합니다.

* GitHub Actions 인증을 Access Key 방식에서 OIDC 방식으로 전환
* Bedrock IAM 권한을 Foundation Model ARN 단위로 제한
* AI 응답 Schema를 Zod로 런타임 검증
* Usage 증가와 Record 저장을 DynamoDB Transaction으로 묶는 구조 검토
* History 조회 Pagination 추가
* CloudWatch Alarm을 SNS 또는 Slack 알림과 연동
* Grafana Dashboard 고도화
* dev / prod 환경 분리
* Grafana Dashboard 고도화
  - Lambda Error / Duration / Invocations
  - API Gateway 4XX / 5XX / Latency
  - 사용량 제한 429 응답 추적
  - Bedrock 호출 실패율 시각화
