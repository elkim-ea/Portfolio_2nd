import {  useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, signIn } from "aws-amplify/auth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
  const redirectIfAlreadySignedIn = async () => {
    try {
      await getCurrentUser();
      navigate("/dashboard", { replace: true });
    } catch {
      // 로그인 안 된 상태면 LoginPage 유지
    }
  };

  redirectIfAlreadySignedIn();
}, [navigate]);

  const handleLogin = async () => {
  try {
    setIsLoading(true);
    setErrorMessage("");

    const result = await signIn({
      username: email,
      password,
    });

    if (!result.isSignedIn) {
      setErrorMessage("Additional sign-in step is required.");
      return;
    }

    const user = await getCurrentUser();

    localStorage.setItem(
      "koreanmate_user_email",
      user.signInDetails?.loginId ?? email,
    );

    navigate("/dashboard", { replace: true });
  } catch (error) {
    console.error("Failed to login:", error);

    if (
      error instanceof Error &&
      error.name === "UserAlreadyAuthenticatedException"
    ) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Login failed. Please check your email and password.",
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 pt-28">
      <Card className="w-full max-w-md px-12 py-10">
        <h1 className="text-3xl font-extrabold text-slate-950">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">Login to KoreanMate</p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="*******"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
              required
            />
          </label>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          {errorMessage && (
            <p className="text-sm font-medium text-red-500">{errorMessage}</p>
          )}

          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-bold text-blue-600">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}