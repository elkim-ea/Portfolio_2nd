import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { getProfile } from "../api/profileApi";
import { getUsage } from "../api/usageApi";
import type { UserProfile } from "../types/userProfile";
import type { UsageLimit } from "../types/usageLimit";

export type AppLayoutContext = {
  profile: UserProfile | null;
  usage: UsageLimit | null;
  refreshProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
};

export default function AppLayout() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageLimit | null>(null);

  const refreshProfile = useCallback(async () => {
    const data = await getProfile();
    setProfile(data.profile);
  }, []);

  const refreshUsage = useCallback(async () => {
    const data = await getUsage();
    setUsage(data.usage);
  }, []);

  useEffect(() => {
    void refreshProfile();
    void refreshUsage();
  }, [refreshProfile, refreshUsage]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar profile={profile} usage={usage} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-8">
            <Outlet
              context={{
                profile,
                usage,
                refreshProfile,
                refreshUsage,
              }}
            />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}