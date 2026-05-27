import type { LearningRecord } from "../types/learningRecord";
import type { UsageLimit } from "../types/usageLimit";
import type { UserProfile } from "../types/userProfile";
import type { AccountInfo } from "../types/account";

export const mockProfile: UserProfile = {
  userId: "mock-user",
  currentLevel: "beginner",
  levelLabel: "Beginner A2",
  explanationLanguage: "both",
  conversationTone: "polite",
  learningGoal: "daily",
  updatedAt: new Date().toISOString(),
};

export const mockUsage: UsageLimit = {
  userId: "mock-user",
  usageDate: "2026-05-28",
  correctionCount: 2,
  conversationCount: 1,
  totalCount: 3,
  ttl: 1780000000,
};

export const mockRecords: LearningRecord[] = [
  {
    userId: "mock-user",
    recordId: "2026-05-28T01:00:00.000Z#correction#001",
    type: "correction",
    inputText: "오늘 저는 학교에 갑니다.",
    outputText:
      "Corrected Korean: 오늘 저는 학교에 갔습니다.\n\nExplanation: Because the sentence talks about something that already happened today, the past tense form '갔습니다' is more natural than '갑니다'.",
    level: "beginner",
    createdAt: "2026-05-28T01:00:00.000Z",
  },
  {
    userId: "mock-user",
    recordId: "2026-05-28T01:10:00.000Z#conversation#002",
    type: "conversation",
    inputText: "ordering food at a restaurant",
    outputText:
      "Teacher: 주문하시겠어요?\nRomanization: Jumunhasigesseoyo?\nMeaning: Would you like to order?\n\nStudent: 네, 김치찌개 하나 주세요.\nRomanization: Ne, gimchi jjigae hana juseyo.\nMeaning: Yes, please give me one kimchi stew.\n\nExplanation: '-주세요' is a polite way to ask for something in Korean.",
    topic: "ordering food at a restaurant",
    level: "beginner",
    createdAt: "2026-05-28T01:10:00.000Z",
  },
  {
    userId: "mock-user",
    recordId: "2026-05-28T01:20:00.000Z#level-test#003",
    type: "level-test",
    inputText: "저는 한국어를 조금 공부했어요.",
    outputText:
      "Estimated Level: Beginner A2\n\nExplanation: You can write simple Korean sentences, but your grammar range is still limited. You should continue practising tense, particles, and basic sentence patterns.",
    level: "beginner",
    createdAt: "2026-05-28T01:20:00.000Z",
  },
  {
    userId: "mock-user",
    recordId: "2026-05-28T01:30:00.000Z#correction#004",
    type: "correction",
    inputText: "저는 어제 친구를 만나요.",
    outputText:
      "Corrected Korean: 저는 어제 친구를 만났어요.\n\nExplanation: The word '어제' means yesterday, so the verb should be in the past tense. '만나요' is present tense, and '만났어요' is past tense.",
    level: "beginner",
    createdAt: "2026-05-28T01:30:00.000Z",
  },
  {
    userId: "mock-user",
    recordId: "2026-05-28T01:40:00.000Z#conversation#005",
    type: "conversation",
    inputText: "asking for directions",
    outputText:
      "Teacher: 어디로 가시나요?\nRomanization: Eodiro gasinayo?\nMeaning: Where are you going?\n\nStudent: 지하철역에 가고 싶어요.\nRomanization: Jihacheolyeoge gago sipeoyo.\nMeaning: I want to go to the subway station.\n\nExplanation: '-고 싶어요' means 'I want to...' and is useful for beginner conversations.",
    topic: "asking for directions",
    level: "beginner",
    createdAt: "2026-05-28T01:40:00.000Z",
  },
];

export const weeklyUsageData = [
  { day: "Mon", requests: 4 },
  { day: "Tue", requests: 7 },
  { day: "Wed", requests: 5 },
  { day: "Thu", requests: 9 },
  { day: "Fri", requests: 8 },
  { day: "Sat", requests: 11 },
  { day: "Sun", requests: 9 },
];

export const weeklyActivityData = [
  { day: "Mon", records: 3 },
  { day: "Tue", records: 6 },
  { day: "Wed", records: 4 },
  { day: "Thu", records: 8 },
  { day: "Fri", records: 7 },
  { day: "Sat", records: 10 },
  { day: "Sun", records: 8 },
];
export const mockAccount: AccountInfo = {
  userId: "cognito-sub-mock-001",
  email: "user@example.com",
  plan: "Free Plan",
  accountStatus: "active",
  provider: "cognito",
  createdAt: "2026-05-28T00:00:00.000Z",
  lastLoginAt: "2026-05-28T02:30:00.000Z",
};