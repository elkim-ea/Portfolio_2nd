import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { getProfile, updateProfile } from "../api/profileApi";
import type { LearningLevel } from "../types/learningRecord";
import type {
  ConversationTone,
  ExplanationLanguage,
  LearningGoal,
} from "../types/userProfile";

export default function SettingsPage() {
  const [email, setEmail] = useState("Signed in");
  const [userId, setUserId] = useState("Unknown");

  const [currentLevel, setCurrentLevel] =
    useState<LearningLevel>("beginner");
  const [levelLabel, setLevelLabel] = useState("Beginner A2");
  const [explanationLanguage, setExplanationLanguage] =
    useState<ExplanationLanguage>("both");
  const [conversationTone, setConversationTone] =
    useState<ConversationTone>("polite");
  const [learningGoal, setLearningGoal] = useState<LearningGoal>("daily");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setMessage("");

        const user = await getCurrentUser();

        setUserId(user.userId);
        setEmail(
          user.signInDetails?.loginId ??
            localStorage.getItem("koreanmate_user_email") ??
            "Signed in",
        );

        const data = await getProfile();

        setCurrentLevel(data.profile.currentLevel);
        setLevelLabel(data.profile.levelLabel);
        setExplanationLanguage(data.profile.explanationLanguage);
        setConversationTone(data.profile.conversationTone);
        setLearningGoal(data.profile.learningGoal ?? "daily");
      } catch (error) {
        console.error("Failed to load profile:", error);
        setMessage("Failed to load profile settings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage("");

      const data = await updateProfile({
        currentLevel,
        levelLabel,
        explanationLanguage,
        conversationTone,
        learningGoal,
      });

      setCurrentLevel(data.profile.currentLevel);
      setLevelLabel(data.profile.levelLabel);
      setExplanationLanguage(data.profile.explanationLanguage);
      setConversationTone(data.profile.conversationTone);
      setLearningGoal(data.profile.learningGoal ?? "daily");

      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account information and Korean learning preferences."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Account Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Basic Cognito account metadata.
              </p>
            </div>

            <Badge tone="green">Authenticated</Badge>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {email}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                User ID
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                {userId}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Cognito
              </p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">
            Learning Profile
          </h2>

          {isLoading ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Loading profile settings...
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Current Level
                  </span>
                  <select
                    value={currentLevel}
                    onChange={(event) =>
                      setCurrentLevel(event.target.value as LearningLevel)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Level Label
                  </span>
                  <input
                    value={levelLabel}
                    onChange={(event) => setLevelLabel(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Explanation Language
                  </span>
                  <select
                    value={explanationLanguage}
                    onChange={(event) =>
                      setExplanationLanguage(
                        event.target.value as ExplanationLanguage,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <option value="ko">Korean</option>
                    <option value="en">English</option>
                    <option value="both">Both</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Conversation Tone
                  </span>
                  <select
                    value={conversationTone}
                    onChange={(event) =>
                      setConversationTone(event.target.value as ConversationTone)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <option value="polite">Polite</option>
                    <option value="casual">Casual</option>
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Learning Goal
                  </span>
                  <select
                    value={learningGoal}
                    onChange={(event) =>
                      setLearningGoal(event.target.value as LearningGoal)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <option value="daily">Daily Korean</option>
                    <option value="travel">Travel Korean</option>
                    <option value="business">Business Korean</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>

                {message && (
                  <p className="text-sm font-medium text-slate-600">
                    {message}
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}