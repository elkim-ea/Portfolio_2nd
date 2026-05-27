type BadgeProps = {
  children: string;
  tone?: "blue" | "green" | "yellow" | "gray";
};

export default function Badge({ children, tone = "gray" }: BadgeProps) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    gray: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}