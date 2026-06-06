import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { confirmSignUp } from "aws-amplify/auth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

export default function ConfirmSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirmSignup = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      alert("가입을 축하드립니다. 로그인 후 테스트를 진행하고 레벨을 확인해보세요.");
      navigate("/login");
    } catch (error) {
      console.error("Failed to confirm signup:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to confirm signup. Please check your code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-6 pt-28">
      <Card className="w-full max-w-md px-12 py-10">
        <h1 className="text-3xl font-extrabold text-slate-950">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          이메일로 전송된 인증 코드를 입력하세요.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirmSignup();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Verification Code
            </span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm outline-none focus:border-blue-500"
              required
            />
          </label>

          {errorMessage && (
            <p className="text-sm font-medium text-red-500">{errorMessage}</p>
          )}

          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
      </Card>
    </main>
  );
}