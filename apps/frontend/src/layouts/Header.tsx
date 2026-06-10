import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, signOut } from "aws-amplify/auth";

export default function Header() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("Signed in");

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();

        const loginId =
          user.signInDetails?.loginId ??
          localStorage.getItem("koreanmate_user_email") ??
          "Signed in";

        setEmail(loginId);
        localStorage.setItem("koreanmate_user_email", loginId);
      } catch {
        setEmail("Signed in");
      }
    };

    loadCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut({ global: true });
      localStorage.removeItem("koreanmate_user_email");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <Link
        to="/dashboard"
        className="flex items-center text-2xl font-extrabold tracking-tight text-slate-950"
      >
        KoreanMate
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
            Free Plan
          </span>
          <span className="max-w-64 truncate text-slate-600">{email}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}