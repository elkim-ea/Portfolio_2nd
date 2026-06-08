# KoreanMate Runbook

> 목적: KoreanMate Serverless 운영 중 발생할 수 있는 주요 장애 상황에 대해 확인 순서, 원인 분석 방법, 임시 대응, 복구 절차를 정리한다.
> 기준 환경: AWS Seoul Region `ap-northeast-2`, `dev` 환경, Terraform 기반 Serverless 구조

---

## 1. Runbook 개요

KoreanMate는 React/Vite 기반 프론트엔드를 S3 + CloudFront로 배포하고, 백엔드는 API Gateway HTTP API + Lambda + DynamoDB + Bedrock으로 구성된 Serverless 애플리케이션이다.

운영 중 장애가 발생하면 다음 순서로 확인한다.

```text
사용자 화면
  ↓
CloudFront / S3
  ↓
API Gateway
  ↓
Cognito JWT Authorizer
  ↓
Lambda
  ↓
DynamoDB / Bedrock
  ↓
CloudWatch / X-Ray / Grafana / CloudTrail
```

장애 대응의 기본 원칙은 다음과 같다.

| 원칙       | 설명                                                         |
| -------- | ---------------------------------------------------------- |
| 영향 범위 확인 | 프론트엔드 문제인지, API 문제인지, 인증 문제인지 먼저 분리한다.                     |
| 최근 변경 확인 | 최근 배포, Terraform apply, GitHub Actions 실행 내역을 확인한다.        |
| 로그 기반 확인 | 추측하지 않고 CloudWatch Logs, API 응답 코드, Grafana 지표를 기준으로 판단한다. |
| 임시 복구 우선 | 사용자 접근이 막힌 경우 원인 분석보다 우선적으로 서비스 복구를 진행한다.                  |
| 재발 방지 기록 | 장애 원인, 조치, 개선점을 troubleshooting.md에 기록한다.                  |

---

## 2. 주요 운영 도구

| 도구                 | 사용 목적                     |
| ------------------ | ------------------------- |
| CloudWatch Logs    | Lambda 실행 로그 확인           |
| CloudWatch Metrics | Lambda, API Gateway 지표 확인 |
| CloudWatch Alarm   | 오류율, 지연 시간, 5XX 감지        |
| X-Ray              | Lambda 호출 흐름 추적           |
| Grafana Cloud      | CloudWatch 메트릭 시각화        |
| CloudTrail         | AWS API 변경 이력 확인          |
| AWS Budgets        | 비용 초과 여부 확인               |
| GitHub Actions     | CI/CD 실행 결과 확인            |
| Terraform          | 인프라 상태 확인 및 복구            |

---

## 3. 공통 장애 확인 절차

장애가 발생하면 아래 순서대로 확인한다.

### 3.1 사용자 증상 확인

| 확인 항목    | 예시                                          |
| -------- | ------------------------------------------- |
| 접속 불가    | CloudFront URL 접속 실패                        |
| 화면 깨짐    | 프론트엔드 정적 파일 로딩 실패                           |
| API 실패   | 401, 403, 429, 500 응답                       |
| AI 응답 실패 | correction, conversation, level-test 결과 미반환 |
| 데이터 미조회  | history, usage, profile 데이터 조회 실패           |

### 3.2 최근 변경 확인

```bash
git log --oneline -5
```

GitHub Actions 실행 결과 확인:

```text
GitHub Repository
→ Actions
→ serverless-ci.yml / serverless-deploy.yml
→ 최근 실패 Job 확인
```

Terraform 변경 여부 확인:

```bash
cd infra/serverless/envs/dev
terraform plan
```

### 3.3 AWS 리소스 상태 확인

```bash
aws sts get-caller-identity
aws apigatewayv2 get-apis --region ap-northeast-2
aws lambda list-functions --region ap-northeast-2
aws dynamodb list-tables --region ap-northeast-2
```

---

## 4. 프론트엔드 접속 장애

### 증상

| 증상                   | 가능성                        |
| -------------------- | -------------------------- |
| CloudFront URL 접속 불가 | CloudFront 배포 문제           |
| 403 Access Denied    | S3 OAC 또는 Bucket Policy 문제 |
| 이전 화면이 계속 보임         | CloudFront 캐시 문제           |
| JS/CSS 로딩 실패         | S3 업로드 누락 또는 build 결과 문제   |

### 확인 절차

CloudFront 응답 확인:

```bash
curl -I https://<cloudfront-domain>
```

S3 빌드 파일 확인:

```bash
aws s3 ls s3://<frontend-bucket-name> --recursive
```

CloudFront Distribution 확인:

```bash
aws cloudfront get-distribution --id <distribution-id>
```

### 대응 방법

프론트엔드 재빌드:

```bash
cd apps/frontend
npm install
npm run build
```

S3 재업로드:

```bash
aws s3 sync dist/ s3://<frontend-bucket-name> --delete
```

CloudFront 캐시 무효화:

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### 복구 기준

| 기준                    | 확인 방법               |
| --------------------- | ------------------- |
| CloudFront URL 200 응답 | `curl -I`           |
| 최신 화면 반영              | 브라우저 새로고침           |
| JS/CSS 정상 로딩          | 개발자 도구 Network 탭 확인 |

---

## 5. API 401 Unauthorized

### 증상

API 호출 시 401 Unauthorized 응답이 반환된다.

### 주요 원인

| 원인                           | 설명                              |
| ---------------------------- | ------------------------------- |
| JWT 누락                       | Authorization Header 없음         |
| JWT 만료                       | Access Token 만료                 |
| 잘못된 Token 사용                 | ID Token / Access Token 혼동      |
| Cognito 설정 오류                | issuer, audience, client id 불일치 |
| API Gateway Authorizer 설정 오류 | JWT Authorizer 연결 누락            |

### 확인 절차

브라우저 개발자 도구에서 요청 Header 확인:

```text
Authorization: Bearer <token>
```

API Gateway Authorizer 설정 확인:

```bash
aws apigatewayv2 get-authorizers \
  --api-id <api-id> \
  --region ap-northeast-2
```

Cognito User Pool Client 확인:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id <user-pool-id> \
  --client-id <client-id> \
  --region ap-northeast-2
```

### 대응 방법

1. 프론트엔드에서 Authorization Header가 포함되는지 확인한다.
2. 토큰이 만료된 경우 재로그인 또는 refresh token 처리를 확인한다.
3. API Gateway JWT Authorizer의 issuer와 audience 값을 확인한다.
4. Cognito User Pool ID와 Client ID가 프론트엔드 환경변수와 일치하는지 확인한다.

### 복구 기준

| 기준                     | 확인 방법              |
| ---------------------- | ------------------ |
| 인증된 API 요청 200 응답      | 로그인 후 API 재호출      |
| 인증 없는 요청 401 응답        | 토큰 제거 후 API 호출     |
| Lambda가 Cognito sub 수신 | CloudWatch Logs 확인 |

---

## 6. API 429 Too Many Requests

### 증상

AI 기능 요청 시 429 응답이 반환된다.

### 구분해야 할 429

| 구분                          | 설명                |
| --------------------------- | ----------------- |
| API Gateway Throttling 429  | API Gateway 요청 제한 |
| Application Usage Limit 429 | 사용자별 일일 AI 사용량 제한 |

### 확인 절차

응답 Body 확인:

```json
{
  "message": "You have used all of today's writing correction attempts."
}
```

위와 같이 기능별 사용량 제한 메시지가 있으면 애플리케이션 레벨 429다.

API Gateway Throttle 설정 확인:

```bash
aws apigatewayv2 get-stages \
  --api-id <api-id> \
  --region ap-northeast-2
```

DynamoDB UsageLimits 확인:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

### 대응 방법

사용량 제한 429인 경우:

1. 정상 동작으로 판단한다.
2. DynamoDB UsageLimits 테이블에서 해당 userId와 usageDate의 count 값을 확인한다.
3. 필요한 경우 테스트 계정의 사용량 데이터를 삭제하거나 다음 날짜에 다시 테스트한다.

테스트 데이터 삭제 예시:

```bash
aws dynamodb delete-item \
  --table-name <usage-limits-table-name> \
  --key '{"userId":{"S":"<user-id>"},"usageDate":{"S":"YYYY-MM-DD"}}' \
  --region ap-northeast-2
```

API Gateway Throttling 429인 경우:

1. Stage throttle 설정을 확인한다.
2. 비정상 요청이 많으면 WAF Rate Limit 또는 CloudWatch Metrics를 확인한다.
3. 정상 요청이 많은 경우 throttle limit 조정을 검토한다.

### 복구 기준

| 기준                | 확인 방법              |
| ----------------- | ------------------ |
| 정상 한도 내 요청 200 응답 | 사용량 초기화 후 API 호출   |
| 한도 초과 요청 429 응답   | 반복 호출 테스트          |
| Bedrock 불필요 호출 차단 | CloudWatch Logs 확인 |

---

## 7. API 500 Internal Server Error

### 증상

API 요청 시 500 응답이 반환된다.

### 주요 원인

| 원인             | 설명                              |
| -------------- | ------------------------------- |
| Lambda 환경변수 누락 | Table name, model id 등 누락       |
| IAM 권한 부족      | DynamoDB, Bedrock, X-Ray 접근 실패  |
| Bedrock 호출 실패  | 모델 권한, 리전, 요청 형식 문제             |
| DynamoDB 요청 실패 | Key schema, UpdateExpression 문제 |
| 코드 배포 오류       | Lambda zip 또는 handler 설정 오류     |

### 확인 절차

Lambda 로그 확인:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --follow \
  --region ap-northeast-2
```

Lambda 환경변수 확인:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --region ap-northeast-2
```

Lambda IAM Role 확인:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --query 'Role' \
  --region ap-northeast-2
```

CloudWatch Metrics 확인:

```text
CloudWatch
→ Metrics
→ Lambda
→ Errors / Duration / Invocations
```

Grafana Cloud 확인:

```text
Grafana Cloud
→ CloudWatch Data Source
→ Lambda / API Gateway Dashboard
→ Error, Duration, 5XX 지표 확인
```

### 대응 방법

1. CloudWatch Logs에서 에러 메시지를 확인한다.
2. 환경변수 누락이면 Terraform variables 또는 Lambda module 설정을 확인한다.
3. IAM AccessDenied이면 Lambda Execution Role Policy를 확인한다.
4. Bedrock ValidationException이면 모델 ID, 리전, Bedrock access 상태를 확인한다.
5. DynamoDB ValidationException이면 Key Schema와 UpdateExpression을 확인한다.
6. 최근 배포 이후 발생했다면 이전 정상 커밋으로 되돌린 뒤 재배포한다.

### 복구 기준

| 기준              | 확인 방법                                      |
| --------------- | ------------------------------------------ |
| API 200 응답      | curl 또는 프론트엔드 테스트                          |
| Lambda Error 감소 | CloudWatch / Grafana 확인                    |
| 정상 데이터 저장       | DynamoDB 테이블 조회                            |
| AI 결과 반환        | correction / conversation / level-test 테스트 |

---

## 8. Bedrock 호출 실패

### 증상

AI 응답 생성에 실패하거나 Lambda에서 Bedrock 관련 오류가 발생한다.

### 주요 원인

| 원인                       | 설명                         |
| ------------------------ | -------------------------- |
| Bedrock Model Access 미승인 | 모델 사용 권한 없음                |
| 잘못된 Model ID             | SSM Parameter 또는 환경변수 값 오류 |
| IAM 권한 부족                | bedrock:InvokeModel 권한 누락  |
| 요청 형식 오류                 | Bedrock API body 형식 불일치    |
| 리전 오류                    | 모델 지원 리전과 Lambda 리전 불일치    |

### 확인 절차

Lambda 환경변수 확인:

```bash
aws lambda get-function-configuration \
  --function-name <lambda-function-name> \
  --query 'Environment.Variables' \
  --region ap-northeast-2
```

SSM Parameter 확인:

```bash
aws ssm get-parameter \
  --name /<project>/<env>/bedrock/model-id \
  --region ap-northeast-2
```

IAM Policy 확인:

```bash
aws iam get-role-policy \
  --role-name <lambda-execution-role-name> \
  --policy-name <policy-name>
```

CloudWatch Logs에서 Bedrock 에러 확인:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --region ap-northeast-2
```

### 대응 방법

1. AWS Console에서 Bedrock Model Access 승인 상태를 확인한다.
2. `BEDROCK_MODEL_ID` 값이 실제 사용 가능한 모델인지 확인한다.
3. Lambda IAM Role에 `bedrock:InvokeModel` 권한이 있는지 확인한다.
4. 요청 Body 형식을 코드에서 확인한다.
5. 모델 ID를 변경한 경우 Terraform apply 후 Lambda 환경변수가 갱신되었는지 확인한다.

### 복구 기준

| 기준               | 확인 방법              |
| ---------------- | ------------------ |
| Bedrock 호출 성공    | AI 기능 API 호출       |
| Lambda Error 없음  | CloudWatch Logs    |
| 결과가 DynamoDB에 저장 | LearningRecords 조회 |

---

## 9. DynamoDB 저장 또는 조회 실패

### 증상

AI 결과는 반환되지만 학습 기록이 저장되지 않거나, History / Usage 조회가 실패한다.

### 주요 원인

| 원인                  | 설명                                        |
| ------------------- | ----------------------------------------- |
| Table name 환경변수 누락  | Lambda가 테이블 이름을 찾지 못함                     |
| IAM 권한 부족           | DynamoDB PutItem, Query, UpdateItem 권한 부족 |
| Key Schema 불일치      | PK/SK 이름 불일치                              |
| userId 누락           | Cognito sub 추출 실패                         |
| UpdateExpression 오류 | Usage count 증가 로직 문제                      |

### 확인 절차

테이블 목록 확인:

```bash
aws dynamodb list-tables --region ap-northeast-2
```

LearningRecords 확인:

```bash
aws dynamodb scan \
  --table-name <learning-records-table-name> \
  --region ap-northeast-2
```

UsageLimits 확인:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

Lambda 로그 확인:

```bash
aws logs tail /aws/lambda/<lambda-function-name> \
  --region ap-northeast-2
```

### 대응 방법

1. Lambda 환경변수의 테이블 이름을 확인한다.
2. Terraform output의 테이블 이름과 실제 DynamoDB 테이블 이름을 비교한다.
3. Lambda IAM Role에 DynamoDB 권한이 있는지 확인한다.
4. Query 조건이 PK/SK 설계와 일치하는지 확인한다.
5. UsageLimits UpdateExpression 오류가 있으면 count 필드 업데이트 로직을 수정한다.

### 복구 기준

| 기준            | 확인 방법                      |
| ------------- | -------------------------- |
| AI 요청 후 기록 저장 | LearningRecords scan/query |
| 사용량 증가        | UsageLimits scan/query     |
| History 조회 성공 | `/history` API 호출          |
| Usage 조회 성공   | `/usage` API 호출            |

---

## 10. GitHub Actions CI 실패

### 증상

Pull Request 또는 수동 실행한 CI Pipeline이 실패한다.

### 주요 원인

| 원인                    | 설명                             |
| --------------------- | ------------------------------ |
| TypeScript 오류         | 타입 체크 실패                       |
| Frontend build 실패     | Vite build 오류                  |
| Backend build 실패      | esbuild 또는 tsconfig 오류         |
| Terraform validate 실패 | Terraform 문법 또는 provider 설정 오류 |
| Trivy Scan 실패         | 취약점 또는 IaC 보안 경고               |

### 확인 절차

```text
GitHub Repository
→ Actions
→ serverless-ci.yml
→ 실패한 Job 선택
→ 실패 Step 로그 확인
```

로컬에서 동일 명령어 실행:

```bash
cd apps/backend
npm install
npm run build
```

```bash
cd apps/frontend
npm install
npm run build
```

```bash
cd infra/serverless/envs/dev
terraform fmt -check
terraform init -backend=false
terraform validate
```

### 대응 방법

1. 실패한 Job을 먼저 확인한다.
2. 로컬에서 동일 명령어를 실행해 재현한다.
3. TypeScript 오류는 타입 정의 또는 optional 값 처리를 수정한다.
4. Terraform 오류는 module input/output, provider 설정, 변수 누락을 확인한다.
5. Trivy 실패는 실제 위험도와 포트폴리오 기준 허용 여부를 판단하여 수정하거나 예외 처리 근거를 남긴다.

### 복구 기준

| 기준                    | 확인 방법                |
| --------------------- | -------------------- |
| CI 전체 Job 성공          | GitHub Actions       |
| Backend build 성공      | `npm run build`      |
| Frontend build 성공     | `npm run build`      |
| Terraform validate 성공 | `terraform validate` |

---

## 11. GitHub Actions Deploy 실패

### 증상

Deploy Pipeline 실행 중 Terraform apply, Lambda packaging, S3 upload, CloudFront invalidation 단계가 실패한다.

### 주요 원인

| 원인                         | 설명                                     |
| -------------------------- | -------------------------------------- |
| GitHub Secrets 누락          | AWS credentials, API URL, Cognito 값 누락 |
| Lambda package 누락          | zip 파일 생성 실패                           |
| Terraform apply 실패         | AWS 리소스 충돌 또는 권한 부족                    |
| S3 upload 실패               | Bucket name 오류 또는 권한 부족                |
| CloudFront invalidation 실패 | Distribution ID 오류 또는 path 형식 오류       |

### 확인 절차

```text
GitHub Repository
→ Actions
→ serverless-deploy.yml
→ 실패한 Step 로그 확인
```

GitHub Secrets 확인:

```text
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
```

Terraform plan 확인:

```bash
cd infra/serverless/envs/dev
terraform plan
```

CloudFront Distribution 확인:

```bash
aws cloudfront list-distributions
```

### 대응 방법

1. 실패 Step을 기준으로 원인을 분리한다.
2. GitHub Secrets 값이 누락되었는지 확인한다.
3. Lambda zip packaging이 정상 생성되는지 확인한다.
4. Terraform apply 실패 시 에러 메시지 기준으로 리소스 충돌 여부를 확인한다.
5. CloudFront invalidation path는 반드시 `/`로 시작해야 한다.

올바른 invalidation 예시:

```bash
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### 복구 기준

| 기준                 | 확인 방법                        |
| ------------------ | ---------------------------- |
| Deploy Pipeline 성공 | GitHub Actions               |
| API 정상 응답          | curl 또는 프론트엔드 테스트            |
| 최신 프론트 반영          | CloudFront URL 접속            |
| Lambda 최신 코드 반영    | CloudWatch Logs 또는 테스트 응답 확인 |

---

## 12. 비용 증가 대응

### 증상

AWS 비용이 예상보다 빠르게 증가한다.

### 주요 원인

| 원인                  | 설명               |
| ------------------- | ---------------- |
| Bedrock 호출 증가       | AI 요청 과다         |
| CloudWatch Logs 증가  | 로그 출력 과다         |
| CloudTrail S3 저장 증가 | 감사 로그 누적         |
| DynamoDB 요청 증가      | 반복 테스트 또는 무한 호출  |
| CloudFront 요청 증가    | 비정상 접근 또는 캐시 미적중 |

### 확인 절차

AWS Budgets 확인:

```text
AWS Console
→ Billing and Cost Management
→ Budgets
```

Cost Explorer 확인:

```text
AWS Console
→ Billing and Cost Management
→ Cost Explorer
→ Service별 비용 확인
```

CloudWatch Logs 저장량 확인:

```text
CloudWatch
→ Logs
→ Log groups
→ Stored bytes 확인
```

UsageLimits 데이터 확인:

```bash
aws dynamodb scan \
  --table-name <usage-limits-table-name> \
  --region ap-northeast-2
```

### 대응 방법

1. Cost Explorer에서 비용이 증가한 서비스를 먼저 확인한다.
2. Bedrock 비용이면 사용자별 사용량 제한이 정상 동작하는지 확인한다.
3. CloudWatch Logs 비용이면 로그 보관 기간과 로그 출력량을 줄인다.
4. CloudTrail 로그는 S3 Lifecycle 설정을 확인한다.
5. 비정상 요청이 많으면 WAF Rate Limit을 확인한다.

### 복구 기준

| 기준               | 확인 방법                |
| ---------------- | -------------------- |
| 비용 증가 원인 서비스 확인  | Cost Explorer        |
| Bedrock 호출 제한 정상 | UsageLimits 확인       |
| 로그 보관 기간 적용      | CloudWatch Log Group |
| Budget 알림 정상     | AWS Budgets          |

---

## 13. CloudWatch / Grafana 확인 기준

### CloudWatch에서 확인할 지표

| 리소스         | 주요 지표                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Lambda      | Invocations, Errors, Duration, Throttles                                 |
| API Gateway | Count, 4XX, 5XX, Latency                                                 |
| DynamoDB    | ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits, ThrottledRequests |
| CloudFront  | Requests, 4xxErrorRate, 5xxErrorRate                                     |
| WAF         | BlockedRequests, AllowedRequests                                         |

### Grafana에서 확인할 지표

| Dashboard 영역 | 확인 내용                                 |
| ------------ | ------------------------------------- |
| API Gateway  | 요청 수, 4XX, 5XX, Latency               |
| Lambda       | 호출 수, 에러 수, 실행 시간                     |
| DynamoDB     | 읽기/쓰기 요청, throttle 여부                 |
| CloudFront   | 요청 수, 에러율                             |
| Cost 관련      | Budgets 또는 비용 알림은 AWS Console에서 최종 확인 |

Grafana Cloud는 CloudWatch Data Source와 연동되어 있으며, API 요청 실행 시 그래프 변동을 통해 메트릭 수집 여부를 확인한다.

---

## 14. 장애 대응 기록 양식

장애가 발생하면 아래 형식으로 `docs/troubleshooting.md`에 기록한다.

```md
## 문제 제목

### 증상
- 어떤 기능에서 문제가 발생했는지 작성

### 원인
- 로그와 지표를 기준으로 확인한 원인 작성

### 해결
- 실제 수행한 조치 작성

### 결과
- 복구 여부와 확인 방법 작성

### 배운 점
- 재발 방지를 위해 개선할 점 작성
```

---

## 15. 긴급 복구 체크리스트

장애 발생 시 최소한 아래 항목을 빠르게 확인한다.

```text
[ ] CloudFront URL 접속 가능 여부 확인
[ ] API Gateway URL 직접 호출
[ ] 로그인 후 Authorization Header 포함 여부 확인
[ ] CloudWatch Logs에서 Lambda Error 확인
[ ] Grafana에서 API/Lambda 지표 확인
[ ] DynamoDB 테이블에 데이터 저장 여부 확인
[ ] Bedrock 호출 오류 여부 확인
[ ] 최근 GitHub Actions Deploy 실패 여부 확인
[ ] 최근 Terraform apply 변경 여부 확인
[ ] 비용 이상 증가 여부 확인
```

---

## 16. 운영 개선 예정

현재 Runbook은 `dev` 환경 기준의 운영 대응 절차다. 향후 운영 수준을 높이기 위해 다음을 개선한다.

| 개선 항목                 | 설명                                              |
| --------------------- | ----------------------------------------------- |
| SNS / Slack 알림        | CloudWatch Alarm 발생 시 즉시 알림                     |
| Grafana Dashboard 고도화 | Lambda, API Gateway, Bedrock, 429 응답 중심 대시보드 구성 |
| GitHub OIDC           | GitHub Actions에서 장기 Access Key 제거               |
| Bedrock IAM 제한        | Foundation Model ARN 단위로 권한 축소                  |
| DynamoDB Transaction  | 사용량 증가와 학습 기록 저장 정합성 개선                         |
| History Pagination    | 학습 기록 조회 성능 개선                                  |
| prod 환경 분리            | dev와 prod 인프라 분리                                |
