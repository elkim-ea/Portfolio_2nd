# 002. DynamoDB Usage Limit Model

## 1. Context

KoreanMate는 한국어 학습자를 위한 AI 기반 글쓰기 교정 및 회화 생성 서비스이다.

서비스는 Amazon Bedrock을 사용하여 AI 응답을 생성한다.

Bedrock 호출은 사용량에 따라 비용이 발생할 수 있으므로, 사용자별 AI 호출 횟수를 제한하는 구조가 필요하다.

현재 학습 기록 저장 모델은 다음 문서에서 먼저 결정했다.

```text
docs/decisions/001-dynamodb-learning-record-model.md
```

학습 기록 저장 흐름은 다음과 같다.

```text
service
  ↓
generateText()
  ↓
saveLearningRecord()
  ↓
DynamoDB
```

하지만 최종 서비스 흐름에서는 AI 호출 전에 사용량 제한을 확인해야 한다.

```text
service
  ↓
checkUsageLimit()
  ↓
generateText()
  ↓
incrementUsage()
  ↓
saveLearningRecord()
  ↓
return response
```

이 문서는 사용자별 AI 사용량 제한을 위한 DynamoDB 테이블 구조를 결정하기 위한 문서이다.

---

## 2. Decision

사용자별 일일 AI 호출 횟수를 관리하기 위해 별도의 DynamoDB 테이블을 사용한다.

| 항목 | 값 |
| --- | --- |
| Table Name | `koreanmate-dev-usage-limits` |
| Partition Key | `userId` |
| Sort Key | `usageDate` |
| Billing Mode | `PAY_PER_REQUEST` |
| TTL Attribute | `ttl` |
| GSI | 없음 |

---

## 3. Why Separate Table

처음에는 `LearningRecords` 테이블에 사용량 정보를 함께 저장할 수도 있다.

하지만 학습 기록과 사용량 제한은 데이터 성격이 다르다.

| 항목 | LearningRecords | UsageLimits |
| --- | --- | --- |
| 목적 | AI 결과 저장 | AI 호출 횟수 제한 |
| 데이터 성격 | 기록성 데이터 | 카운터 데이터 |
| 주요 작업 | PutItem | GetItem / UpdateItem |
| 조회 기준 | 사용자별 기록 조회 | 사용자별 날짜별 사용량 조회 |
| TTL 필요성 | 선택 | 필요 |
| 업데이트 빈도 | AI 결과 생성 시 1회 저장 | AI 호출마다 카운터 증가 |

따라서 사용량 제한은 별도 테이블로 분리한다.

이 구조는 다음 역량을 포트폴리오에서 설명하기 좋다.

| 역량 | 설명 |
| --- | --- |
| 비용 최적화 | AI 호출 횟수를 제한하여 Bedrock 비용 폭주 방지 |
| Serverless 설계 | DynamoDB 기반 사용량 관리 |
| 운영 안정성 | 사용자별 quota 관리 |
| 보안/남용 방지 | 과도한 반복 호출 방지 |
| 확장성 | 향후 요금제, 관리자 정책으로 확장 가능 |

---

## 4. Access Patterns

현재 MVP에서 필요한 Access Pattern은 다음과 같다.

| Access Pattern | 설명 | Query 방식 |
| --- | --- | --- |
| AP1 | 오늘 사용량 조회 | `PK = userId`, `SK = usageDate` |
| AP2 | AI 호출 전 제한 확인 | `GetItem(userId, usageDate)` |
| AP3 | AI 호출 성공 후 카운터 증가 | `UpdateItem(userId, usageDate)` |
| AP4 | 오래된 사용량 데이터 자동 삭제 | TTL 사용 |

관리자 전체 통계, 월별 통계, 사용자별 장기 분석은 현재 MVP 범위에 포함하지 않는다.

따라서 GSI는 생성하지 않는다.

---

## 5. Key Design

### Partition Key

```text
userId
```

`userId`는 Cognito 적용 후 Cognito User Pool의 `sub` 값을 사용한다.

예시:

```text
a1b2c3d4-xxxx-xxxx-xxxx-123456789abc
```

사용자별 사용량 제한이 핵심 Access Pattern이므로 `userId`를 Partition Key로 사용한다.

---

### Sort Key

```text
usageDate
```

`usageDate`는 날짜 문자열을 사용한다.

형식:

```text
YYYY-MM-DD
```

예시:

```text
2026-05-25
```

시간까지 포함하지 않는 이유는 하루 단위 사용량 제한을 관리하기 위해서이다.

같은 사용자의 같은 날짜 사용량은 하나의 아이템으로 관리한다.

```text
userId + usageDate = 하루 사용량 아이템
```

예시:

```text
user-123 + 2026-05-25
```

---

## 6. Table Schema

| 필드명 | 타입 | 키 | 제약 조건 | 데이터 설명 |
| --- | --- | --- | --- | --- |
| `userId` | string | PK | NOT NULL | Cognito sub |
| `usageDate` | string | SK | NOT NULL | YYYY-MM-DD |
| `correctionCount` | number |  | NOT NULL | 글쓰기 교정 사용 횟수 |
| `conversationCount` | number |  | NOT NULL | 회화 생성 사용 횟수 |
| `totalCount` | number |  | NOT NULL | 총 AI 호출 횟수 |
| `ttl` | number |  | NOT NULL | 만료 시간, Unix timestamp |

---

## 7. Type Definition

```ts
export type UsageType = "correction" | "conversation";

export type UsageLimit = {
  userId: string;
  usageDate: string;
  correctionCount: number;
  conversationCount: number;
  totalCount: number;
  ttl: number;
};
```

---

## 8. Daily Limit Policy

초기 MVP에서는 단순한 고정 제한을 사용한다.

| 항목 | 제한 |
| --- | --- |
| 글쓰기 교정 | 10회 / day |
| 회화 생성 | 10회 / day |
| 전체 AI 호출 | 20회 / day |

초기 정책 예시:

```ts
export const DAILY_USAGE_LIMITS = {
  correction: 10,
  conversation: 10,
  total: 20,
} as const;
```

이 값은 처음에는 코드 상수로 관리하고, 향후 관리자 설정이나 환경변수로 분리할 수 있다.

---

## 9. Item Example

```json
{
  "userId": "user-123",
  "usageDate": "2026-05-25",
  "correctionCount": 3,
  "conversationCount": 2,
  "totalCount": 5,
  "ttl": 1779667200
}
```

---

## 10. TTL Strategy

`UsageLimits` 테이블은 오래된 사용량 데이터를 계속 보관할 필요가 없다.

따라서 DynamoDB TTL을 사용하여 일정 기간이 지난 아이템을 자동 삭제한다.

초기 MVP에서는 30일 보관을 기준으로 한다.

```text
ttl = 현재 날짜 기준 30일 뒤 Unix timestamp
```

예시:

```ts
const ttl = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
```

주의할 점:

- TTL 값은 number 타입으로 저장한다.
- TTL attribute 이름은 `ttl`로 사용한다.
- TTL 삭제는 즉시 수행되지 않을 수 있다.
- TTL은 비용 최적화와 불필요한 데이터 정리에 사용한다.

---

## 11. Usage Check Flow

AI 호출 전에는 먼저 사용량 제한을 확인한다.

```text
1. userId 확인
2. 오늘 날짜 usageDate 생성
3. UsageLimits에서 userId + usageDate 조회
4. 현재 count 확인
5. 제한 초과 여부 판단
6. 제한 초과 시 429 응답
7. 제한 미초과 시 Bedrock 호출 진행
```

예상 함수:

```ts
await checkUsageLimit({
  userId,
  type: "correction",
});
```

---

## 12. Usage Increment Flow

AI 호출이 성공한 후에 사용량을 증가시킨다.

```text
1. Bedrock 호출 성공
2. UsageLimits 카운터 증가
3. LearningRecords에 결과 저장
4. 사용자에게 응답 반환
```

예상 함수:

```ts
await incrementUsage({
  userId,
  type: "correction",
});
```

주의할 점:

- AI 호출 전에 증가시키면 실패한 요청도 사용량으로 계산될 수 있다.
- 초기 MVP에서는 AI 호출 성공 후 증가시킨다.
- 향후 남용 방지가 더 중요해지면 요청 시작 시점에 증가시키는 방식도 고려할 수 있다.

---

## 13. Expected Service Flow

글쓰기 교정 최종 흐름:

```text
correctKoreanText()
  ↓
checkUsageLimit(userId, "correction")
  ↓
generateText()
  ↓
incrementUsage(userId, "correction")
  ↓
saveLearningRecord()
  ↓
return correctedText
```

회화 생성 최종 흐름:

```text
generateConversation()
  ↓
checkUsageLimit(userId, "conversation")
  ↓
generateText()
  ↓
incrementUsage(userId, "conversation")
  ↓
saveLearningRecord()
  ↓
return conversation
```

---

## 14. Error Policy

사용량 제한을 초과하면 API는 다음과 같은 응답을 반환한다.

```json
{
  "message": "Daily AI usage limit exceeded."
}
```

권장 HTTP status code:

```text
429 Too Many Requests
```

초기 MVP에서는 단순 메시지를 반환한다.

향후에는 아래 정보를 추가할 수 있다.

| 필드 | 설명 |
| --- | --- |
| `limit` | 일일 제한 |
| `used` | 현재 사용량 |
| `resetAt` | 다음 초기화 시간 |
| `type` | correction 또는 conversation |

---

## 15. GSI Strategy

MVP 단계에서는 GSI를 만들지 않는다.

현재 필요한 조회는 사용자별 날짜별 사용량 조회이므로 기본 Primary Key 구조만으로 충분하다.

향후 기능이 확장되면 다음 GSI를 고려한다.

| 향후 요구사항 | 가능한 GSI 설계 |
| --- | --- |
| 전체 사용자 일별 사용량 조회 | `GSI1PK = usageDate`, `GSI1SK = totalCount` |
| 사용량 많은 사용자 조회 | `GSI1PK = usageDate`, `GSI1SK = totalCount` |
| 관리자 월별 통계 | 별도 Analytics 구조 고려 |

현재는 MVP 범위를 줄이기 위해 GSI를 생성하지 않는다.

---

## 16. Current Scope

이번 단계에서 구현할 범위는 다음과 같다.

```text
1. DynamoDB 사용량 제한 모델 확정
2. 환경변수에 UsageLimits 테이블명 추가
3. usageLimitRepository.ts 생성
4. checkUsageLimit() 구현
5. incrementUsage() 구현
6. correctionService.ts에 사용량 제한 연결
7. conversationService.ts에 사용량 제한 연결
8. npm run build 확인
```

---

## 17. Out of Scope

이번 단계에서 제외하는 항목은 다음과 같다.

| 제외 항목 | 이유 |
| --- | --- |
| 관리자 사용량 대시보드 | MVP 이후 기능 |
| 월별 사용량 통계 | 현재는 일일 제한만 필요 |
| 요금제별 quota | 결제/구독 기능이 아직 없음 |
| 사용자별 커스텀 제한 | 초기 MVP에서는 고정 제한 사용 |
| GSI 생성 | 현재 Access Pattern에서는 불필요 |

---

## 18. Final Decision

사용자별 AI 사용량 제한은 다음 구조로 확정한다.

```text
Table: koreanmate-dev-usage-limits

PK: userId
SK: usageDate
TTL Attribute: ttl
```

MVP에서는 하루 단위로 다음 값을 관리한다.

```text
correctionCount
conversationCount
totalCount
```

AI 호출 전에는 `checkUsageLimit()`로 제한 초과 여부를 확인한다.

AI 호출 성공 후에는 `incrementUsage()`로 카운터를 증가시킨다.

GSI는 생성하지 않는다.
