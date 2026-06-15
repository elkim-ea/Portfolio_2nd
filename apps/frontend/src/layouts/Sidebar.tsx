import { NavLink } from "react-router";
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

type SidebarProps = {
  profile: UserProfile | null;
  usage: UsageLimit | null;
};

export default function Sidebar({ profile, usage }: SidebarProps) {
  return (
    <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-64 shrink-0 flex-col bg-slate-950 px-5 py-6 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">KoreanMate</h1>
        <p className="mt-1 text-sm text-slate-400">AI Korean Tutor</p>
      </div>

      <nav className="mt-10 space-y-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center rounded-2xl px-5 py-4 text-lg font-bold transition ${
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

      <div className="mt-auto border-t border-slate-800 pt-5">
        <div className="rounded-2xl bg-slate-900 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current Level
          </p>

          <p className="mt-1 text-base font-bold text-white">
            {profile?.levelLabel ?? "Not tested yet"}
          </p>

          <div className="my-4 border-t border-slate-800" />

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Daily Usage
          </p>

          <p className="mt-1 text-base font-bold text-white">
            {usage?.totalCount ?? 0} / {usage?.dailyLimit ?? 25} requests
          </p>
        </div>
      </div>
    </aside>
  );
}

