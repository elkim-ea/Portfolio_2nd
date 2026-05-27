import { Link } from "react-router";
import Card from "../components/common/Card";

const features = [
  {
    title: "Level Test",
    description: "가벼운 진단으로 기본 학습 레벨을 자동 설정합니다.",
  },
  {
    title: "Writing Correction",
    description: "AI가 한국어 문장을 자연스럽게 교정합니다.",
  },
  {
    title: "Conversation Practice",
    description: "상황별 한국어 회화를 생성합니다.",
  },
  {
    title: "Learning History",
    description: "학습 기록을 저장하고 다시 확인합니다.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-10 py-28">
      <section>
        <h1 className="max-w-4xl text-6xl font-extrabold tracking-tight text-slate-950">
          Learn Korean with AI
        </h1>

        <p className="mt-6 max-w-3xl text-xl font-medium text-slate-500">
          한국어 글쓰기 교정, 회화 연습, 레벨 진단을 한 곳에서 관리하세요.
        </p>

        <Link
          to="/signup"
          className="mt-10 inline-flex rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </section>

      <section className="mt-20 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="min-h-44">
            <h2 className="text-base font-bold text-slate-950">
              {feature.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              {feature.description}
            </p>
          </Card>
        ))}
      </section>
    </main>
  );
}