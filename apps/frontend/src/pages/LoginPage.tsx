import { Link, useNavigate } from "react-router";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: Cognito signIn 연결 예정
    navigate("/dashboard");
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
              placeholder="user@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              type="password"
              placeholder="*******"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
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

          <Button className="w-full">Login</Button>
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