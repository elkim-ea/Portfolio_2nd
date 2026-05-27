import { mockAccount } from "../data/mockData";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <h1 className="text-lg font-bold text-slate-950">KoreanMate</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span>{mockAccount.plan}</span>
          <span className="text-slate-300">|</span>
          <span>{mockAccount.email}</span>
        </div>

        <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
          Logout
        </button>
      </div>
    </header>
  );
}