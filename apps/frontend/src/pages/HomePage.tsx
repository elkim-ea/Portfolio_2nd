import { Link } from "react-router";
import Card from "../components/common/Card";

const features = [
  {
    title: "Level Test",
    description: "Set your learning level automatically with a quick assessment.",
  },
  {
    title: "Writing Correction",
    description: "AI helps correct your Korean sentences naturally.",
  },
  {
    title: "Conversation Practice",
    description: "Generate Korean conversation practice for real-life situations.",
  },
  {
    title: "Learning History",
    description: "Save your learning records and review them anytime.",
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
          Manage Korean writing correction, conversation practice, and level assessment in one place.
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