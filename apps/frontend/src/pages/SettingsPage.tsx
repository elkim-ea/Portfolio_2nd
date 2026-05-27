import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { mockAccount, mockProfile } from "../data/mockData";

export default function SettingsPage() {
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

            <Badge tone="green">{mockAccount.accountStatus}</Badge>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {mockAccount.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                User ID
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                {mockAccount.userId}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {mockAccount.provider}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Created At
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {new Date(mockAccount.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Last Login
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {mockAccount.lastLoginAt
                  ? new Date(mockAccount.lastLoginAt).toLocaleString()
                  : "No login record"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">
            Learning Profile
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Current Level
              </span>
              <select
                defaultValue={mockProfile.currentLevel}
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
                defaultValue={mockProfile.levelLabel}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Explanation Language
              </span>
              <select
                defaultValue={mockProfile.explanationLanguage}
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
                defaultValue={mockProfile.conversationTone}
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
                defaultValue={mockProfile.learningGoal ?? "daily"}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              >
                <option value="daily">Daily Korean</option>
                <option value="travel">Travel Korean</option>
                <option value="business">Business Korean</option>
              </select>
            </label>
          </div>

          <div className="mt-6">
            <Button>Save Settings</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}