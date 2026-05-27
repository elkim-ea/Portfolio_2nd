import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import {
  mockProfile,
  mockRecords,
  mockUsage,
  weeklyActivityData,
  weeklyUsageData,
} from "../data/mockData";
import BarChartCard from "../components/dashboard/BarChartCard";
import QuickActions from "../components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Check your learning status, daily AI usage, and recent study records."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-slate-500">Current Level</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {mockProfile.levelLabel}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {mockProfile.currentLevel}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-500">
            Writing Corrections
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {mockUsage.correctionCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">Today</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-500">Conversations</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {mockUsage.conversationCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">Today</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-500">Total AI Calls</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {mockUsage.totalCount} / 20
          </p>
          <p className="mt-1 text-sm text-slate-500">Daily limit</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <BarChartCard
          title="Weekly AI Usage"
          description="Bedrock request count by day"
          data={weeklyUsageData}
          dataKey="requests"
        />

        <BarChartCard
          title="Weekly Learning Activity"
          description="Corrections and conversations saved"
          data={weeklyActivityData}
          dataKey="records"
        />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">
              Recent Learning Records
            </h2>
            <Badge>Latest 3</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {mockRecords.slice(0, 3).map((record) => (
              <div
                key={record.recordId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    tone={record.type === "correction" ? "blue" : "green"}
                  >
                    {record.type}
                  </Badge>

                  {record.level && <Badge>{record.level}</Badge>}
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  {record.inputText}
                </p>

                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {record.outputText}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}