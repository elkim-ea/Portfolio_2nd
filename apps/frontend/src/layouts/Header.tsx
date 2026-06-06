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
      <Link to="/dashboard" className="text-lg font-bold text-slate-950">
        KoreanMate
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span>Free Plan</span>
          <span className="text-slate-300">|</span>
          <span>{email}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}