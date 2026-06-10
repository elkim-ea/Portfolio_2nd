import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { getProfile, updateProfile } from "../api/profileApi";
import type { LearningGoal } from "../types/userProfile";
import { getLearningLevelLabel } from "../constants/learningLevels";

export default function SettingsPage() {
  const [email, setEmail] = useState("Signed in");
  const [userId, setUserId] = useState("Unknown");

  const [currentLevelLabel, setCurrentLevelLabel] = useState("A1 Beginner");
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

        setCurrentLevelLabel(
          data.profile.levelLabel ??
            getLearningLevelLabel(data.profile.currentLevel),
        );
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
        learningGoal,
      });

      setCurrentLevelLabel(
        data.profile.levelLabel ??
          getLearningLevelLabel(data.profile.currentLevel),
      );
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
              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Current Level
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800">
                    {currentLevelLabel}
                  </div>

                  <p className="text-xs text-slate-500">
                    Current Level is updated only through the Level Test result.
                  </p>
                </div>

                <label className="block space-y-2">
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

