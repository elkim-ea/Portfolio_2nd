import { useNavigate } from "react-router";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const handleResetPassword = () => {
    // TODO: Cognito confirmResetPassword 연결 예정
    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    navigate("/login");
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 pt-24">
      <Card className="w-full max-w-md px-12 py-10">
        <h1 className="text-3xl font-extrabold text-slate-950">
          Create new password
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Enter the verification code and set a new password.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleResetPassword();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Verification Code
            </span>
            <input
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">
              New Password
            </span>
            <input
              type="password"
              placeholder="*******"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Confirm New Password
            </span>
            <input
              type="password"
              placeholder="*******"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <Button className="w-full">Reset Password</Button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          After success: redirect to Login screen
        </p>
      </Card>
    </main>
  );
}