# 001. DynamoDB Learning Record Model

## 1. Context

KoreanMate는 한국어 학습자를 위한 AI 기반 글쓰기 교정 및 회화 생성 서비스이다.

현재 백엔드는 다음 흐름까지 구현되어 있다.

```text
handler
  ↓
request validation
  ↓
service
  ↓
external/bedrockClient mock
```

다음 단계에서는 AI 응답 결과를 사용자별 학습 기록으로 저장해야 한다.

```text
service
  ↓
repository
  ↓
DynamoDB
```

이 문서는 학습 기록 저장을 위한 DynamoDB 테이블 구조를 결정하기 위한 문서이다.

---

## 2. Decision

학습 기록 저장소로 Amazon DynamoDB를 사용한다.

초기 MVP에서는 글쓰기 교정 기록과 회화 생성 기록을 하나의 테이블에 저장한다.

| 항목 | 값 |
| --- | --- |
| Table Name | `koreanmate-dev-learning-records` |
| Partition Key | `userId` |
| Sort Key | `recordId` |
| Billing Mode | `PAY_PER_REQUEST` |
| GSI | 없음 |

---

## 3. Why DynamoDB

KoreanMate는 AWS Serverless 기반 서비스이다.

서비스 구조는 다음과 같다.

```text
API Gateway
  ↓
Lambda
  ↓
DynamoDB
```

DynamoDB를 선택한 이유는 다음과 같다.

| 이유 | 설명 |
| --- | --- |
| Serverless 구조와 적합 | Lambda와 함께 사용하기 좋음 |
| 초기 트래픽 예측 어려움 | 사용량 기반으로 시작 가능 |
| 사용자별 기록 조회에 적합 | `userId` 기준 Query 가능 |
| 운영 부담 감소 | 서버 관리가 필요 없음 |
| 비용 최적화 | On-Demand 사용 시 요청 기반 과금 가능 |

DynamoDB On-Demand 모드는 capacity planning 없이 시작할 수 있고, 사용한 read/write 요청량 기준으로 과금된다. 초기 트래픽을 예측하기 어려운 MVP 단계에 적합하다.

---

## 4. Access Patterns

현재 MVP에서 필요한 조회 패턴은 다음과 같다.

| Access Pattern | 설명 | Query 방식 |
| --- | --- | --- |
| AP1 | 사용자별 전체 학습 기록 조회 | `PK = userId` |
| AP2 | 사용자별 최근 학습 기록 조회 | `PK = userId`, `ScanIndexForward = false`, `Limit = N` |
| AP3 | 단일 학습 기록 조회 | `PK = userId`, `SK = recordId` |

현재 단계에서는 관리자 전체 조회, 통계 조회, 타입별 전체 조회는 MVP 범위에 포함하지 않는다.

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

사용자별 학습 기록 조회가 핵심 Access Pattern이므로 `userId`를 Partition Key로 사용한다.

---

### Sort Key

```text
recordId
```

`recordId`는 다음 형식으로 생성한다.

```text
{createdAt}#{type}#{uuid}
```

예시:

```text
2026-05-25T04:10:00.000Z#correction#8f3a2c
```

이 구조를 사용하는 이유는 다음과 같다.

| 이유 | 설명 |
| --- | --- |
| 시간순 정렬 | ISO datetime이 앞에 있어 시간순 정렬 가능 |
| 중복 방지 | UUID를 포함해 같은 시간 생성 충돌 방지 |
| 타입 확인 가능 | `correction`, `conversation` 구분 가능 |
| 단건 조회 가능 | `userId + recordId`로 특정 기록 조회 가능 |

---

## 6. Table Schema

| 필드명 | 타입 | 키 | 제약 조건 | 데이터 설명 |
| --- | --- | --- | --- | --- |
| `userId` | string | PK | NOT NULL | Cognito sub |
| `recordId` | string | SK | NOT NULL | 시간 + 타입 + UUID |
| `type` | string |  | NOT NULL | correction / conversation |
| `inputText` | string |  | NOT NULL | 사용자 입력 |
| `outputText` | string |  | NOT NULL | AI 응답 |
| `topic` | string |  | NULL | 회화 주제 |
| `createdAt` | string |  | NOT NULL | ISO datetime |

---

## 7. Type Definition

```ts
export type LearningRecordType = "correction" | "conversation";

export type LearningRecord = {
  userId: string;
  recordId: string;
  type: LearningRecordType;
  inputText: string;
  outputText: string;
  topic?: string;
  createdAt: string;
};
```

`topic`은 회화 생성 기록에서만 사용한다.

글쓰기 교정 기록에서는 저장하지 않는다.

---

## 8. Correction Record Example

```json
{
  "userId": "user-123",
  "recordId": "2026-05-25T04:10:00.000Z#correction#abc123",
  "type": "correction",
  "inputText": "저는 어제 학교에 가요",
  "outputText": "저는 어제 학교에 갔어요.",
  "createdAt": "2026-05-25T04:10:00.000Z"
}
```

---

## 9. Conversation Record Example

```json
{
  "userId": "user-123",
  "recordId": "2026-05-25T04:15:00.000Z#conversation#def456",
  "type": "conversation",
  "topic": "cafe",
  "inputText": "cafe",
  "outputText": "카페에서 주문하는 회화...",
  "createdAt": "2026-05-25T04:15:00.000Z"
}
```

---

## 10. GSI Strategy

MVP 단계에서는 GSI를 만들지 않는다.

현재 필요한 조회는 사용자별 기록 조회이므로 기본 Primary Key 구조만으로 충분하다.

향후 기능이 확장되면 다음 GSI를 고려한다.

| 향후 요구사항 | 가능한 GSI 설계 |
| --- | --- |
| 관리자 전체 기록 최신순 조회 | `GSI1PK = RECORD`, `GSI1SK = createdAt` |
| 사용자별 타입 필터 조회 | `GSI1PK = userId#type`, `GSI1SK = createdAt` |
| 타입별 전체 기록 조회 | `GSI1PK = type`, `GSI1SK = createdAt` |

현재는 기능 범위를 줄이기 위해 GSI를 생성하지 않는다.

---

## 11. Current Scope

이번 단계에서 구현할 범위는 다음과 같다.

```text
1. DynamoDB 학습 기록 모델 확정
2. 환경변수에 테이블명 추가
3. learningRecordRepository.ts 생성
4. saveLearningRecord() 구현
5. correctionService.ts에서 저장 호출
6. conversationService.ts에서 저장 호출
7. npm run build 확인
```

조회 API는 이번 단계에서 구현하지 않는다.

---

## 12. Out of Scope

이번 단계에서 제외하는 항목은 다음과 같다.

| 제외 항목 | 이유 |
| --- | --- |
| 학습 기록 조회 API | 저장 기능 구현 후 진행 |
| UsageLimits 테이블 | AI 사용량 제한 단계에서 진행 |
| 관리자 전체 조회 | MVP 이후 기능 |
| GSI 생성 | 현재 Access Pattern에서는 불필요 |
| Member 테이블 | Cognito를 사용할 예정이므로 별도 회원 테이블 불필요 |

---

## 13. Final Decision

학습 기록 저장은 다음 구조로 확정한다.

```text
Table: koreanmate-dev-learning-records

PK: userId
SK: recordId
```

`recordId`는 다음 형식으로 생성한다.

```text
{createdAt}#{type}#{uuid}
```

MVP에서는 하나의 테이블에 `correction`과 `conversation` 기록을 함께 저장한다.

GSI는 생성하지 않는다.
