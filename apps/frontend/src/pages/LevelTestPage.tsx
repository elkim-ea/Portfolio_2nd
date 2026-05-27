import { useState } from "react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Textarea from "../components/common/Textarea";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import type { LevelTestApiResponse } from "../types/aiResult";

export default function LevelTestPage() {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<LevelTestApiResponse | null>(null);

  const handleSubmit = () => {
    const mockResponse: LevelTestApiResponse = {
      type: "level-test",
      inputText: answer,
      result: {
        estimatedLevel: "beginner",
        levelLabel: "Beginner A2",
        explanationEnglish:
          "You can write simple Korean sentences, but your grammar range is still limited. You should continue practising tense, particles, and basic sentence patterns.",
        weaknesses: [
          "Limited sentence variety",
          "Needs more practice with particles",
          "Needs more tense consistency",
        ],
        nextActions: [
          "Practise basic past tense forms.",
          "Review common particles such as 은/는 and 을/를.",
          "Use conversation practice with polite tone.",
        ],
      },
      outputText: "",
      level: "Beginner A2",
    };

    setResult(mockResponse);
    alert(`Your Korean level is ${mockResponse.result.levelLabel}.`);
  };

  return (
    <div>
      <PageHeader
        title="Level Test"
        description="Write a short Korean answer and get your estimated Korean level."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">Test Question</h2>
          <p className="mt-2 text-sm text-slate-500">
            Write at least 3 Korean sentences about what you did today.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Example topic: 오늘 한 일
          </p>

          <div className="mt-4 space-y-4">
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="예: 오늘 저는 학교에 갔어요..."
            />

            <Button onClick={handleSubmit} disabled={!answer.trim()}>
              Analyze My Level
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Test Result</h2>
            {result && <Badge tone="blue">{result.result.levelLabel}</Badge>}
          </div>

          {!result ? (
            <div className="mt-4 min-h-64 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Your level test result will appear here.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <section className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                  Estimated Level
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">
                  {result.result.levelLabel}
                </p>
              </section>

              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Explanation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {result.result.explanationEnglish}
                </p>
              </section>

              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Weaknesses
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.result.weaknesses.map((weakness) => (
                    <li key={weakness}>{weakness}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Next Actions
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.result.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </section>

              <Button variant="secondary">Apply to Profile</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}