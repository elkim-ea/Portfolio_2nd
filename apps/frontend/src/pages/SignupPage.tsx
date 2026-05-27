import { Link, useNavigate } from "react-router";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function SignupPage() {
  const navigate = useNavigate();

  const handleSignup = () => {
    // TODO: Cognito signUp 연결 예정
    navigate("/level-test");
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 pt-24">
      <Card className="w-full max-w-md px-12 py-10">
        <h1 className="text-3xl font-extrabold text-slate-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          회원가입 후 가벼운 레벨 테스트를 진행합니다.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSignup();
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

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Confirm Password
            </span>
            <input
              type="password"
              placeholder="*******"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <Button className="w-full">Sign Up</Button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Already have account?{" "}
          <Link to="/login" className="font-bold text-blue-600">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}