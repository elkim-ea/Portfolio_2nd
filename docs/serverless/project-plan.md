# KoreanMate Project Plan
 
> 관련 문서: `docs/serverless-design.md`, `docs/troubleshooting.md`, `docs/runbook.md`

---

## 1. 프로젝트 개요

KoreanMate는 한국어를 학습하는 외국인 사용자를 대상으로 하는 AI 기반 한국어 학습 웹 애플리케이션이다.

사용자는 다음 기능을 사용할 수 있다.

- 한국어 글쓰기 교정
- 상황별 한국어 회화 생성
- 한국어 레벨 테스트
- 사용자별 학습 기록 조회
- 일일 사용량 확인

이 프로젝트의 목적은 단순한 AI 웹앱 구현이 아니라, AWS Serverless 기반의 실제 운영 구조를 포트폴리오 수준으로 설계하고 구현하는 것이다.

---

## 2. 문제 정의

한국어 학습자는 다음과 같은 문제를 겪는다.

| 문제 | 설명 |
|---|---|
| 자연스러운 표현 확인 어려움 | 작성한 한국어 문장이 실제로 자연스러운지 바로 확인하기 어렵다. |
| 상황별 회화 예시 부족 | 음식 주문, 여행, 비즈니스 등 실제 상황에 맞는 회화 예문을 직접 만들기 어렵다. |
| 수준별 피드백 부족 | 자신의 한국어 수준에 맞는 설명과 교정 기준을 받기 어렵다. |
| 학습 기록 부족 | 일반 AI 서비스는 이전 학습 기록, 사용량, 개인화 설정을 체계적으로 관리하기 어렵다. |
| AI 호출 비용 관리 필요 | AI API는 호출량에 따라 비용이 증가하므로 사용량 제한이 필요하다. |

KoreanMate는 AI 교정, 회화 생성, 레벨 테스트, 학습 기록 저장, 사용량 제한을 통해 위 문제를 해결한다.

---

## 3. 프로젝트 목표

### 3.1 서비스 목표

| 목표 | 설명 |
|---|---|
| 글쓰기 교정 | 사용자가 입력한 한국어 문장을 AI가 교정한다. |
| 회화 생성 | 사용자가 입력한 상황을 기반으로 한국어 회화 예문을 생성한다. |
| 레벨 테스트 | 사용자의 한국어 입력을 기반으로 예상 학습 수준을 제공한다. |
| 학습 기록 저장 | 사용자별 AI 학습 결과를 저장하고 조회한다. |
| 사용량 제한 | 사용자별 일일 사용량을 제한하여 비용을 제어한다. |
| 로그인 기반 사용자 분리 | Cognito 인증 정보를 기준으로 사용자 데이터를 분리한다. |

### 3.2 인프라 목표

| 목표 | 설명 |
|---|---|
| Serverless 구조 | API Gateway, Lambda, DynamoDB, S3, CloudFront 중심으로 구성한다. |
| IaC | Terraform으로 주요 AWS 리소스를 관리한다. |
| 인증/인가 | Cognito와 API Gateway JWT Authorizer를 사용한다. |
| 비용 관리 | 사용량 제한, DynamoDB On-demand, AWS Budgets를 적용한다. |
| 보안 | IAM, KMS, WAF, S3 OAC를 사용한다. |
| 관측성 | CloudWatch, X-Ray, Grafana Cloud를 사용한다. |
| 감사 | CloudTrail로 AWS API 호출 이력을 남긴다. |
| CI/CD | GitHub Actions에서 CI와 Deploy를 분리한다. |

### 3.3 포트폴리오 목표

이 프로젝트로 보여주려는 역량은 다음과 같다.

- AWS Serverless 아키텍처 설계
- Terraform 기반 IaC 구성
- Cognito 기반 인증/인가 설계
- Lambda 기반 백엔드 API 구성
- DynamoDB 데이터 모델링
- AI API 사용량 제한 설계
- CloudWatch / CloudTrail / Grafana 기반 운영 설계
- GitHub Actions 기반 CI/CD 자동화
- 비용 최적화 및 트러블슈팅 문서화

---

## 4. 주요 사용자와 사용 시나리오

### 4.1 주요 사용자

한국어를 공부하는 외국인 학습자

### 4.2 기본 사용 시나리오

1. 사용자가 회원가입 또는 로그인한다.
2. 사용자가 한국어 문장 또는 회화 주제를 입력한다.
3. Frontend가 Cognito JWT를 포함하여 API를 호출한다.
4. API Gateway가 JWT를 검증한다.
5. Lambda가 사용량 제한을 확인한다.
6. 한도 내 요청이면 Bedrock을 호출한다.
7. AI 결과와 사용량 정보가 DynamoDB에 저장된다.
8. 사용자는 결과와 최근 학습 기록을 확인한다.

---

## 5. 기능 범위

### 5.1 현재 구현 범위

| 구분 | 기능 | 상태 |
|---|---|---|
| Frontend | Home / Login / Signup | 구현 |
| Frontend | Dashboard | 구현 |
| Frontend | Correction Page | 구현 |
| Frontend | Conversation Page | 구현 |
| Frontend | Level Test Page | 구현 |
| Frontend | History Page | 구현 |
| Frontend | Settings Page | 구현 |
| Backend | Correction API | 구현 |
| Backend | Conversation API | 구현 |
| Backend | Level Test API | 구현 |
| Backend | Profile API | 구현 |
| Backend | History API | 구현 |
| Backend | Usage API | 구현 |
| Infra | API Gateway HTTP API | 구현 |
| Infra | Lambda | 구현 |
| Infra | DynamoDB | 구현 |
| Infra | Cognito | 구현 |
| Infra | S3 + CloudFront | 구현 |
| Infra | SSM Parameter Store | 구현 |
| Infra | KMS | 구현 |
| Infra | CloudFront WAF | 구현 |
| Infra | CloudTrail | 구현 |
| Infra | AWS Budgets | 구현 |
| CI/CD | GitHub Actions CI | 구현 |
| CI/CD | GitHub Actions Deploy | 구현 |
| Security | Trivy Scan | 구현 |
| Observability | CloudWatch Log / Alarm | 구현 |
| Observability | Grafana Cloud IAM Role | 구현 |

### 5.2 향후 확장 범위

| 구분 | 기능 | 설명 |
|---|---|---|
| Observability | Grafana Dashboard 고도화 | API, Lambda, Bedrock 관련 지표 시각화 |
| Observability | CloudWatch Synthetics | 주요 API 상태 주기적 확인 |
| Alerting | SNS / Slack 알림 | CloudWatch Alarm 발생 시 알림 전송 |
| Security | GitHub OIDC | GitHub Actions의 AWS Access Key 제거 |
| Security | Bedrock IAM Resource 제한 | 사용하는 Foundation Model ARN으로 권한 제한 |
| Security | AI 응답 Schema 검증 | Bedrock 응답을 Zod로 런타임 검증 |
| Data | History Pagination | 학습 기록 조회 페이지네이션 |
| Operation | Runbook | 장애 대응 절차 문서화 |
| Operation | Troubleshooting | 문제, 시도, 해결, 배운 점 정리 |
| Architecture | EKS Version | 별도 확장 버전으로 검토 |

### 5.3 현재 범위에서 제외하는 것

| 제외 항목 | 이유 |
|---|---|
| 결제 기능 | 포트폴리오 핵심 범위가 아님 |
| 관리자 페이지 | 현재는 사용자 학습 기능과 인프라 운영 설계가 우선 |
| 모바일 앱 | 웹 기반 Serverless 포트폴리오가 목적 |
| 대규모 상용 트래픽 대응 | 초기 개인 포트폴리오 서비스 기준 |
| EKS 운영 버전 | 현재 Serverless 버전과 분리하여 향후 확장으로 관리 |

---

## 6. 요구사항 명세

### 6.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|---|---|---|
| FR-01 | 사용자는 회원가입 및 로그인을 할 수 있어야 한다. | High |
| FR-02 | 사용자는 한국어 문장을 입력하고 AI 교정 결과를 받을 수 있어야 한다. | High |
| FR-03 | 사용자는 회화 주제를 입력하고 상황별 한국어 회화를 생성할 수 있어야 한다. | High |
| FR-04 | 사용자는 레벨 테스트를 통해 자신의 한국어 수준을 확인할 수 있어야 한다. | Medium |
| FR-05 | 사용자의 학습 기록은 사용자별로 저장되어야 한다. | High |
| FR-06 | 사용자는 자신의 최근 학습 기록을 조회할 수 있어야 한다. | Medium |
| FR-07 | 사용자는 오늘 사용한 AI 기능 횟수를 확인할 수 있어야 한다. | Medium |
| FR-08 | 일일 사용량 제한을 초과하면 추가 AI 요청이 차단되어야 한다. | High |
| FR-09 | 사용자는 프로필 설정을 조회하고 수정할 수 있어야 한다. | Medium |

### 6.2 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 가용성 | 개인 포트폴리오 수준에서 주요 기능이 안정적으로 접근 가능해야 한다. |
| 확장성 | Lambda와 DynamoDB가 요청 증가에 따라 자동 확장 가능한 구조여야 한다. |
| 보안 | 인증된 사용자만 주요 API에 접근할 수 있어야 한다. |
| 비용 | 사용량이 적을 때 고정비를 최소화해야 한다. |
| 운영성 | 로그, 메트릭, 알람, 트러블슈팅 기록으로 장애 분석이 가능해야 한다. |
| 배포 | GitHub Actions에서 CI와 Deploy를 분리해야 한다. |
| 유지보수성 | Terraform module 기반으로 인프라 리소스를 관리해야 한다. |
| 감사 | CloudTrail로 AWS API 호출 이력을 추적할 수 있어야 한다. |

---

## 7. 트래픽 및 운영 가정

이 프로젝트는 초기 포트폴리오 서비스이며 대규모 상용 트래픽을 전제로 하지 않는다.

| 항목 | 예상 기준 |
|---|---|
| 초기 사용자 | 1~20명 |
| 일일 요청 수 | 50~300회 |
| 주요 API 요청 | correction, conversation, level-test |
| AI 호출 제한 | 사용자별 일일 제한 적용 |
| 데이터 저장량 | 사용자별 학습 기록 중심의 소규모 데이터 |
| 트래픽 특성 | 짧은 요청 후 유휴 시간이 긴 형태 |
| 목표 가동률 | 개인 포트폴리오 기준 99% 수준 목표 |

---

## 8. 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, AWS Lambda |
| API | Amazon API Gateway HTTP API |
| Auth | Amazon Cognito, JWT Authorizer |
| AI | Amazon Bedrock |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| CDN | Amazon CloudFront |
| Config | AWS SSM Parameter Store |
| Security | IAM, KMS, WAF, Trivy |
| Monitoring | CloudWatch, X-Ray, Grafana Cloud |
| Audit | CloudTrail |
| Cost | AWS Budgets, Usage Limit |
| IaC | Terraform |
| CI/CD | GitHub Actions |

---

## 9. 기술 선택 이유

### 9.1 Serverless

초기 사용량이 작고 요청이 항상 발생하지 않기 때문에 상시 서버를 운영하는 EC2나 EKS보다 Serverless 구조가 적합하다. Lambda, API Gateway, DynamoDB, S3, CloudFront를 사용하면 유휴 비용을 줄이고 서버 운영 부담을 낮출 수 있다.

### 9.2 S3 + CloudFront

React/Vite는 정적 파일로 빌드되므로 S3와 CloudFront 조합이 적합하다. S3는 파일 저장을 담당하고, CloudFront는 CDN, HTTPS, 캐싱을 담당한다. S3는 직접 공개하지 않고 CloudFront OAC를 통해서만 접근하도록 구성한다.

### 9.3 API Gateway + Lambda

API Gateway는 인증, CORS, 라우팅을 담당하고 Lambda는 기능별 비즈니스 로직을 실행한다. 기능별 Lambda 분리를 통해 장애 범위와 배포 단위를 줄일 수 있다.

### 9.4 DynamoDB

주요 조회 패턴이 사용자 기준이다. 따라서 Cognito `sub`를 userId로 사용하고, userId 기반 Partition Key로 학습 기록, 사용량, 프로필 데이터를 저장한다. UsageLimits에는 TTL을 적용하여 오래된 사용량 데이터를 자동 삭제한다.

### 9.5 Cognito JWT Authorizer

회원가입과 로그인을 직접 구현하지 않고 Cognito를 사용한다. API Gateway JWT Authorizer가 토큰을 검증하고, Lambda는 Cognito `sub` 값을 userId로 사용한다.

### 9.6 SSM Parameter Store

Bedrock Model ID를 코드에 직접 하드코딩하지 않고 SSM Parameter Store로 관리한다. 현재 구조에서는 Terraform이 SSM Parameter 값을 Lambda 환경변수로 전달한다.

### 9.7 GitHub Actions CI/CD

CI와 Deploy를 분리한다. CI는 빌드, 타입 체크, Terraform validate, Trivy scan을 담당하고, Deploy는 수동 실행으로 Terraform Plan/Apply, S3 업로드, CloudFront Invalidation을 수행한다.

---

## 10. 아키텍처 개요

상세 아키텍처는 `docs/serverless-design.md`에서 관리한다.

요약 구조는 다음과 같다.

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

## 11. 데이터 설계 개요

### 11.1 LearningRecords

| 컬럼 | 타입 | 키 | 설명 |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| recordId | string | SK | createdAt#type#uuid |
| type | string | - | correction / conversation / level-test |
| inputText | string | - | 사용자 입력 |
| outputText | string | - | AI 응답 |
| createdAt | string | - | ISO datetime |

### 11.2 UsageLimits

| 컬럼 | 타입 | 키 | 설명 |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| usageDate | string | SK | YYYY-MM-DD |
| correctionCount | number | - | 글쓰기 교정 사용 횟수 |
| conversationCount | number | - | 회화 생성 사용 횟수 |
| levelTestCount | number | - | 레벨 테스트 사용 횟수 |
| totalCount | number | - | 전체 사용 횟수 |
| ttl | number | - | 자동 삭제 시간 |

### 11.3 UserProfiles

| 컬럼 | 타입 | 키 | 설명 |
|---|---|---|---|
| userId | string | PK | Cognito sub |
| currentLevel | string | - | 사용자 학습 레벨 |
| explanationLanguage | string | - | 설명 언어 |
| conversationTone | string | - | 회화 말투 |
| learningGoal | string | - | 학습 목적 |

---

## 12. 보안 요구사항

| 항목 | 설계 |
|---|---|
| 사용자 인증 | Cognito User Pool |
| API 보호 | API Gateway JWT Authorizer |
| 사용자 식별 | Cognito sub 기반 userId |
| 프론트엔드 접근 | S3 Public Access Block + CloudFront OAC |
| Edge 보안 | CloudFront WAF |
| 권한 관리 | Lambda IAM Role |
| 환경변수 암호화 | KMS |
| 설정 관리 | SSM Parameter Store |
| 감사 로그 | CloudTrail |
| 보안 스캔 | Trivy |

---

## 13. 비용 최적화 전략

| 항목 | 전략 |
|---|---|
| Compute | Lambda 사용으로 요청 시에만 비용 발생 |
| Frontend | S3 + CloudFront 기반 정적 배포 |
| Database | DynamoDB PAY_PER_REQUEST |
| Usage Data | UsageLimits TTL 적용 |
| AI 비용 | 사용자별 일일 사용량 제한 적용 |
| Logs | CloudWatch Logs Retention 설정 |
| Audit Logs | CloudTrail S3 Lifecycle 설정 |
| Budget | AWS Budgets로 비용 알림 구성 |

---

## 14. 운영 및 모니터링 전략

| 도구 | 목적 |
|---|---|
| CloudWatch Logs | Lambda / API Gateway 로그 확인 |
| CloudWatch Alarm | Lambda Error, Duration, API Gateway 5XX 감지 |
| X-Ray | Lambda 호출 추적 |
| Grafana Cloud | CloudWatch 지표 및 로그 시각화 |
| CloudTrail | AWS API 호출 이력 감사 |
| AWS Budgets | 비용 초과 감지 |

---

## 15. CI/CD 전략

### 15.1 CI Pipeline

| Job | 역할 |
|---|---|
| Backend | Typecheck, Build, Lambda Packaging |
| Frontend | React/Vite Build |
| Terraform | fmt, init -backend=false, validate |
| Trivy | Filesystem Scan, IaC Scan |

### 15.2 Deploy Pipeline

Deploy Pipeline은 수동 실행으로만 동작한다.

| 옵션 | 동작 |
|---|---|
| plan-only | Terraform Plan까지만 수행 |
| apply | Terraform Apply, S3 Upload, CloudFront Invalidation 수행 |

---

## 16. WBS

| 단계 | 작업 | 산출물 | 상태 |
|---|---|---|---|
| 1 | 프로젝트 주제 선정 | Project Overview | 완료 |
| 2 | 문제 정의 및 요구사항 작성 | project-plan.md | 완료 |
| 3 | 화면 구조 설계 | User Flow / Wireframe | 완료 |
| 4 | 데이터 모델링 | DynamoDB Table Design | 완료 |
| 5 | 백엔드 로컬 API 구현 | Lambda Handler / Service | 완료 |
| 6 | Bedrock Mock 연동 | bedrockClient mock | 완료 |
| 7 | DynamoDB Repository 구현 | Repository Layer | 완료 |
| 8 | 실제 Bedrock 연동 | Bedrock API 호출 | 완료 |
| 9 | 사용량 제한 구현 | UsageLimits | 완료 |
| 10 | Terraform DynamoDB 구성 | DynamoDB Module | 완료 |
| 11 | Terraform Lambda 구성 | Lambda Module | 완료 |
| 12 | API Gateway 구성 | API Module | 완료 |
| 13 | Cognito 구성 | User Pool / App Client | 완료 |
| 14 | JWT Authorizer 연결 | API 인증 구조 | 완료 |
| 15 | S3 + CloudFront 구성 | Frontend Hosting | 완료 |
| 16 | IAM Role 분리 | IAM Module | 완료 |
| 17 | SSM Parameter Store 적용 | Bedrock Model ID 관리 | 완료 |
| 18 | KMS 적용 | Lambda 환경변수 암호화 | 완료 |
| 19 | WAF 적용 | CloudFront WAF | 완료 |
| 20 | CloudTrail 구성 | Audit Trail | 완료 |
| 21 | AWS Budgets 구성 | 비용 알림 | 완료 |
| 22 | CloudWatch Alarm 구성 | 운영 알람 | 완료 |
| 23 | Grafana Cloud 연동 | CloudWatch Read Role | 부분 완료 |
| 24 | GitHub Actions CI 구성 | serverless-ci.yml | 완료 |
| 25 | GitHub Actions Deploy 구성 | serverless-deploy.yml | 완료 |
| 26 | Trivy 보안 스캔 추가 | Security Scan | 완료 |
| 27 | 설계서 작성 | serverless-design.md | 완료 |
| 28 | 트러블슈팅 문서 작성 | troubleshooting.md | 진행 예정 |
| 29 | Runbook 작성 | runbook.md | 진행 예정 |
| 30 | 최종 README 정리 | README.md | 진행 예정 |

---

## 17. 일정 계획

| 단계 | 주요 작업 | 상태 |
|---|---|---|
| 기획 | 문제 정의, 목표, 기능 범위 정의 | 완료 |
| 설계 | 아키텍처, 데이터, 인증, 보안, 비용 구조 설계 | 완료 |
| 로컬 개발 | 프론트엔드, 백엔드 API, Mock 구성 | 완료 |
| AWS 연동 | DynamoDB, Bedrock, Cognito 연동 | 완료 |
| IaC | Terraform 모듈 구성 | 완료 |
| 배포 | S3 + CloudFront, API Gateway + Lambda 배포 | 완료 |
| 운영 | CloudWatch, CloudTrail, Budgets, Grafana 연동 | 부분 완료 |
| 자동화 | GitHub Actions CI/CD 구성 | 완료 |
| 문서화 | README, 설계서, 트러블슈팅, Runbook 작성 | 진행 중 |



---


## 20. 주요 리스크와 대응 방안

| 리스크 | 영향 | 대응 방안 |
|---|---|---|
| Bedrock 호출 비용 증가 | 예상보다 높은 비용 발생 | 사용자별 일일 사용량 제한, Budgets 적용 |
| Cognito 인증 오류 | API 접근 불가 | JWT 만료/갱신 테스트, 401 오류 구분 |
| Lambda 환경변수 누락 | 런타임 실패 | env schema 검증, Terraform output 확인 |
| API 401/429 혼동 | 원인 파악 지연 | 인증 오류와 사용량 제한 오류 메시지 분리 |
| CloudFront 캐시 문제 | 최신 프론트 반영 지연 | Invalidation 자동화 |
| DynamoDB 데이터 정합성 | 사용량 증가와 기록 저장 불일치 | TransactWriteItems 향후 검토 |
| GitHub Actions Secret 관리 | 장기 Access Key 노출 위험 | GitHub OIDC 전환 |
| Bedrock IAM 권한 과다 | 권한 범위 과다 | Foundation Model ARN으로 제한 |
| CORS 설정 중복 | 보안 정책 혼선 | API Gateway CORS 중심으로 정리 |
| 로그 비용 증가 | 운영 비용 증가 | Log Retention / Lifecycle 설정 |

---

## 21. 완료 기준

| 구분 | 완료 기준 |
|---|---|
| 기능 | correction, conversation, level-test API가 실제 Bedrock과 연동되어 동작 |
| 인증 | 인증되지 않은 사용자는 보호 API 접근 불가 |
| 데이터 | 사용자별 학습 기록과 사용량이 DynamoDB에 저장 |
| 배포 | CloudFront URL로 프론트엔드 접근 가능 |
| IaC | 주요 AWS 리소스가 Terraform으로 관리 |
| CI/CD | GitHub Actions로 CI와 Deploy 흐름 분리 |
| 보안 | Cognito, JWT Authorizer, IAM, KMS, WAF 적용 |
| 운영 | CloudWatch Logs / Alarm으로 장애 원인 확인 가능 |
| 감사 | CloudTrail로 AWS API 호출 이력 확인 가능 |
| 비용 | 사용량 제한과 Budgets로 비용 폭증 방지 |
| 문서 | 계획서, 설계서, 트러블슈팅, README, Runbook 정리 |

---

## 22. 최종 산출물

| 문서 | 목적 | 상태 |
|---|---|---|
| project-plan.md | 프로젝트 목적, 문제 정의, 요구사항, 일정 정리 | 작성 |
| serverless-design.md | 전체 Serverless 설계 설명 | 작성 |
| troubleshooting.md | 문제, 시도, 해결, 배운 점 정리 | 예정 |
| runbook.md | 장애 대응 절차 정리 | 예정 |
| README.md | 포트폴리오 메인 설명 문서 | 예정 |

---

## 23. 프로젝트의 핵심 차별점

KoreanMate의 핵심 차별점은 다음과 같다.

- AI 기능에 사용자별 일일 사용량 제한을 직접 구현했다.
- Cognito JWT `sub` 기반으로 사용자 데이터를 분리했다.
- DynamoDB를 학습 기록, 사용량, 프로필 테이블로 분리했다.
- Terraform으로 주요 AWS 리소스를 코드화했다.
- S3 + CloudFront + OAC로 프론트엔드를 배포했다.
- API Gateway JWT Authorizer로 API를 보호했다.
- CloudWatch, CloudTrail, Grafana, Budgets를 운영 설계에 포함했다.
- GitHub Actions에서 CI와 Deploy를 분리했다.
- Trivy로 보안 스캔을 CI에 포함했다.


