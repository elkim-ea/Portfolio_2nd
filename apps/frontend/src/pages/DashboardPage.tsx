import { useEffect, useMemo, useState } from "react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import BarChartCard from "../components/dashboard/BarChartCard";
import QuickActions from "../components/dashboard/QuickActions";
import { getProfile } from "../api/profileApi";
import { getUsage } from "../api/usageApi";
import { getHistory } from "../api/historyApi";
import type { UserProfile } from "../types/userProfile";
import type { UsageLimit } from "../types/usageLimit";
import type { LearningRecord } from "../types/learningRecord";

type WeeklyRecordData = {
  day: string;
  correction: number;
  conversation: number;
  levelTest: number;
  total: number;
};

const getKstDateKey = (date: Date): string => {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffsetMs);

  return kstDate.toISOString().slice(0, 10);
};

const getWeekdayLabel = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
};

const buildLast7Days = () => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      dateKey: getKstDateKey(date),
      day: getWeekdayLabel(date),
    };
  });
};

const buildWeeklyRecordData = (
  records: LearningRecord[],
): WeeklyRecordData[] => {
  const last7Days = buildLast7Days();

  return last7Days.map(({ dateKey, day }) => {
    const dayRecords = records.filter((record) => {
      const recordDateKey = getKstDateKey(new Date(record.createdAt));

      return recordDateKey === dateKey;
    });

    const correction = dayRecords.filter(
      (record) => record.type === "correction",
    ).length;

    const conversation = dayRecords.filter(
      (record) => record.type === "conversation",
    ).length;

    const levelTest = dayRecords.filter(
      (record) => record.type === "level-test",
    ).length;

    return {
      day,
      correction,
      conversation,
      levelTest,
      total: correction + conversation + levelTest,
    };
  });
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageLimit | null>(null);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [profileResponse, usageResponse, historyResponse] =
          await Promise.all([getProfile(), getUsage(), getHistory()]);

        setProfile(profileResponse.profile);
        setUsage(usageResponse.usage);
        setRecords(historyResponse.records);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        setErrorMessage("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const recentRecords = useMemo(() => records.slice(0, 3), [records]);

  const weeklyRecordData = useMemo(
    () => buildWeeklyRecordData(records),
    [records],
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Check your learning status, daily AI usage, and recent study records."
      />

      {errorMessage && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading dashboard data...</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm font-semibold text-slate-500">
                Current Level
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {profile?.levelLabel ?? "Not tested yet"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {profile?.currentLevel ?? "Complete the level test first"}
              </p>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-slate-500">
                Writing Corrections
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {usage?.correctionCount ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">Today</p>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-slate-500">
                Conversations
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {usage?.conversationCount ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">Today</p>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-slate-500">
                Total AI Calls
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {usage?.totalCount ?? 0} / {usage?.dailyLimit ?? 25}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Remaining: {usage?.remainingCount ?? 25}
              </p>
            </Card>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <BarChartCard
              title="Weekly AI Usage"
              description="Saved AI result records by day"
              data={weeklyRecordData}
              dataKey="total"
            />

            <BarChartCard
              title="Weekly Activity Breakdown"
              description="Correction, conversation, and level test records by day"
              data={weeklyRecordData}
              dataKey="total"
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
                {recentRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No learning records yet. Try a level test, correction, or
                    conversation practice first.
                  </div>
                ) : (
                  recentRecords.map((record) => (
                    <div
                      key={record.recordId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          tone={
                            record.type === "correction" ? "blue" : "green"
                          }
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
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}