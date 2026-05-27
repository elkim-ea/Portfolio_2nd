import { Link, useNavigate } from "react-router";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleSendCode = () => {
    // TODO: Cognito forgotPassword 연결 예정
    navigate("/reset-password");
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 pt-32">
      <Card className="w-full max-w-md px-12 py-10">
        <h1 className="text-3xl font-extrabold text-slate-950">
          Reset your password
        </h1>

        <p className="mt-2 text-sm leading-5 text-slate-500">
          Enter your email. We will send a verification code to reset your
          password.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendCode();
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

          <Button className="w-full">Send Verification Code</Button>
        </form>

        <Link
          to="/login"
          className="mt-5 inline-block text-sm font-bold text-blue-600"
        >
          Back to Login
        </Link>

        <p className="mt-7 text-sm leading-5 text-slate-500">
          Cognito forgotPassword flow: email → code → new password
        </p>
      </Card>
    </main>
  );
}