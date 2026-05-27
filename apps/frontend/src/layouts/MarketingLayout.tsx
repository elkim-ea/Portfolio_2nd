import { Link, Outlet } from "react-router";

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-10">
        <Link to="/" className="text-lg font-bold text-slate-950">
          KoreanMate
        </Link>

        <nav className="flex items-center gap-5">
          <Link to="/" className="text-sm font-semibold text-slate-700">
            Home
          </Link>

          <Link
            to="/login"
            className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}