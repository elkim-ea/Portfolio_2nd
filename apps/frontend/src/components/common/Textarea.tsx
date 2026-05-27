import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`min-h-40 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-slate-500 ${className}`}
      {...props}
    />
  );
}