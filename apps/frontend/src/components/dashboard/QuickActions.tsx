import { useNavigate } from "react-router";

const actions = [
  {
    title: "Writing Correction",
    description: "AI helps correct your Korean sentences naturally.",
    path: "/correction",
    badge: "Correction",
  },
  {
    title: "Conversation",
    description: "Generate Korean conversation practice for real-life situations.",
    path: "/conversation",
    badge: "Speaking",
  },
  {
    title: "Level Test",
    description: "Set your learning level automatically with a quick assessment.",
    path: "/level-test",
    badge: "Level",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-950">
          Quick Actions
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Quickly start your frequently used learning features.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md"
          >
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {action.badge}
            </span>

            <h3 className="mt-5 text-base font-extrabold text-slate-950">
              {action.title}
            </h3>

            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
              {action.description}
            </p>

            <div className="mt-5 text-sm font-bold text-blue-600 transition group-hover:translate-x-1">
              Start →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}