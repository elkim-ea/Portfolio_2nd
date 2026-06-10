import { useState } from "react";
import type { LearningLevel } from "../types/learningRecord";
import type { ExplanationLanguage } from "../types/userProfile";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Textarea from "../components/common/Textarea";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import type { CorrectionApiResponse } from "../types/aiResult";
import { requestCorrection } from "../api/correctionApi";
import { LEARNING_LEVEL_OPTIONS } from "../constants/learningLevels";

const getExplanationTitle = (language: ExplanationLanguage) => {
  if (language === "ko") {
    return "Korean Explanation";
  }

  if (language === "en") {
    return "English Explanation";
  }

  return "Korean + English Explanation";
};

export default function CorrectionPage() {
  const [inputText, setInputText] = useState("");
  const [selectedLevel, setSelectedLevel] =
    useState<LearningLevel>("a2");
  const [explanationLanguage, setExplanationLanguage] =
    useState<ExplanationLanguage>("en");

  const [result, setResult] = useState<CorrectionApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setResult(null);

      const data = await requestCorrection({
        text: trimmedText,
        level: selectedLevel,
        explanationLanguage,
      });

      setResult(data);
    } catch (error) {
      console.error("Failed to request correction:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to correct your Korean text. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Writing Correction"
        description="Write Korean sentences and receive corrections with level-based explanations."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">Your Korean Text</h2>

          <p className="mt-2 text-sm text-slate-500">
            Write a Korean sentence. The AI will correct it based on your
            selected level and explanation language.
          </p>

          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Write your Korean sentence here..."
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Level
                <select
                  value={selectedLevel}
                  onChange={(event) =>
                    setSelectedLevel(event.target.value as LearningLevel)
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
                >
                  {LEARNING_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Explanation Language
                <select
                  value={explanationLanguage}
                  onChange={(event) =>
                    setExplanationLanguage(event.target.value as ExplanationLanguage)
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
                >
                  <option value="both">Korean + English</option>
                  <option value="ko">Korean only</option>
                  <option value="en">English only</option>
                </select>
              </label>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? "Correcting..." : "Correct My Korean"}
            </Button>

            {errorMessage && (
              <p className="text-sm font-medium text-red-500">
                {errorMessage}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-950">
              Correction Result
            </h2>

            {result && <Badge tone="blue">{result.level}</Badge>}
          </div>

          {isLoading ? (
            <div className="mt-4 min-h-64 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Correcting your Korean text...
            </div>
          ) : !result ? (
            <div className="mt-4 min-h-64 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              The correction result will appear here.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Corrected Korean
                </p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {result.result.correctedKorean}
                </p>
              </section>

              <section className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                  {getExplanationTitle(explanationLanguage)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {result.result.explanationEnglish}
                </p>
              </section>

              <section className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Grammar Points
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.result.grammarPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>

              {(explanationLanguage === "both" ||
                explanationLanguage === "en") && (
                <section className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Natural English Meaning
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {result.result.naturalEnglishMeaning}
                  </p>
                </section>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}