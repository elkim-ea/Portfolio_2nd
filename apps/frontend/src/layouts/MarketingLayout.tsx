import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { getCurrentUser } from "aws-amplify/auth";

export default function MarketingLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-10">
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="text-lg font-bold text-slate-950"
        >
          KoreanMate
        </Link>

        <nav className="flex items-center gap-5">
          <Link to="/" className="text-sm font-semibold text-slate-700">
            Home
          </Link>

          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            {isAuthenticated ? "Dashboard" : "Get Started"}
          </Link>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}