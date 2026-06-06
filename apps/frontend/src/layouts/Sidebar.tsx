import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { getProfile } from "../api/profileApi";
import { getUsage } from "../api/usageApi";
import type { UserProfile } from "../types/userProfile";
import type { UsageLimit } from "../types/usageLimit";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Level Test", path: "/level-test" },
  { label: "Correction", path: "/correction" },
  { label: "Conversation", path: "/conversation" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageLimit | null>(null);

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [profileResponse, usageResponse] = await Promise.all([
          getProfile(),
          getUsage(),
        ]);

        setProfile(profileResponse.profile);
        setUsage(usageResponse.usage);
      } catch (error) {
        console.error("Failed to load sidebar data:", error);
      }
    };

    loadSidebarData();
  }, []);

  return (
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-64 shrink-0 flex-col bg-slate-950 px-5 py-6 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold">KoreanMate</h2>
        <p className="mt-2 text-sm text-slate-400">AI Korean Tutor</p>
      </div>

      <nav className="mt-10 space-y-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center rounded-2xl px-4 py-4 text-base font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <span className="flex items-center justify-center gap-3">
                {isActive && (
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                )}
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-6 text-center">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-sm font-medium text-slate-400">Current Level</p>
          <p className="mt-1 text-base font-bold text-white">
            {profile?.levelLabel ?? "Not tested yet"}
          </p>

          <div className="my-4 border-t border-slate-700" />

          <p className="text-sm font-medium text-slate-400">Daily Usage</p>
          <p className="mt-1 text-base font-bold text-white">
            {usage?.totalCount ?? 0} / {usage?.dailyLimit ?? 25} requests
          </p>
        </div>
      </div>
    </aside>
  );
}