import { useState } from "react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import type { ConversationApiResponse } from "../types/aiResult";

export default function ConversationPage() {
  const [topic, setTopic] = useState("ordering food at a restaurant");
  const [result, setResult] = useState<ConversationApiResponse | null>(null);

  const koreanSpeechText = result
    ? result.result.lines.map((line) => line.korean).join(" ")
    : "";

  const handleGenerate = () => {
    const mockResponse: ConversationApiResponse = {
      type: "conversation",
      inputText: topic,
      result: {
        situation: topic,
        lines: [
          {
            role: "teacher",
            korean: "주문하시겠어요?",
            romanization: "Jumunhasigesseoyo?",
            englishMeaning: "Would you like to order?",
          },
          {
            role: "student",
            korean: "네, 김치찌개 하나 주세요.",
            romanization: "Ne, gimchi jjigae hana juseyo.",
            englishMeaning: "Yes, please give me one kimchi stew.",
          },
        ],
        usefulExpressions: [
          {
            korean: "주문하시겠어요?",
            romanization: "Jumunhasigesseoyo?",
            englishMeaning: "Would you like to order?",
            explanationEnglish:
              "This is a polite phrase commonly used by restaurant staff.",
          },
          {
            korean: "하나 주세요.",
            romanization: "Hana juseyo.",
            englishMeaning: "Please give me one.",
            explanationEnglish:
              "'주세요' is a polite request ending used when asking for something.",
          },
        ],
        grammarTipEnglish:
          "The ending '-주세요' is commonly used when politely asking for an item or action.",
      },
      outputText: "",
      level: "Beginner A2",
    };

    setResult(mockResponse);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("This browser does not support speech playback.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(koreanSpeechText);
    utterance.lang = "ko-KR";
    utterance.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div>
      <PageHeader
        title="Conversation Practice"
        description="Generate Korean dialogues with romanization and English explanations."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">
            Conversation Setup
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter a situation. The AI will create a Korean dialogue with English
            meanings.
          </p>

          <div className="mt-4 space-y-4">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-slate-500"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. ordering food at a restaurant"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <select className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <option value="polite">Polite</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <Button onClick={handleGenerate} disabled={!topic.trim()}>
              Generate Conversation
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-950">
              Conversation Result
            </h2>

            <Button variant="secondary" onClick={handleSpeak} disabled={!result}>
              Play Korean Audio
            </Button>
          </div>

          {!result ? (
            <div className="mt-4 min-h-64 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              The generated conversation will appear here.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Situation
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {result.result.situation}
                </p>
              </section>

              <section className="space-y-3">
                {result.result.lines.map((line, index) => (
                  <div
                    key={`${line.role}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3">
                      <Badge tone={line.role === "teacher" ? "blue" : "green"}>
                        {line.role}
                      </Badge>
                    </div>

                    <p className="text-lg font-bold text-slate-950">
                      {line.korean}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-600">
                      {line.romanization}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {line.englishMeaning}
                    </p>
                  </div>
                ))}
              </section>

              <section className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                  Useful Expressions
                </p>

                <div className="mt-3 space-y-3">
                  {result.result.usefulExpressions.map((expression) => (
                    <div
                      key={expression.korean}
                      className="rounded-xl bg-white p-4"
                    >
                      <p className="font-bold text-slate-950">
                        {expression.korean}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-blue-600">
                        {expression.romanization}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {expression.englishMeaning}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {expression.explanationEnglish}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Grammar Tip
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {result.result.grammarTipEnglish}
                </p>
              </section>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}