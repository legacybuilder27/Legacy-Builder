import Link from "next/link";
import type { ReactNode } from "react";

export function buttonClass(variant: "primary" | "secondary" | "quiet" | "danger" = "primary") {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  if (variant === "primary") return `${base} bg-clay-deep text-paper hover:bg-clay`;
  if (variant === "secondary") return `${base} border border-line bg-white text-ink hover:bg-paper-2`;
  if (variant === "danger") return `${base} border border-clay/40 bg-white text-clay-deep hover:bg-paper-2`;
  return `${base} px-2 text-clay-deep underline-offset-4 hover:underline`;
}

export const fieldClass =
  "mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink shadow-sm placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30";

export function Field(props: {
  label: string;
  name: string;
  hint?: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{props.label}</span>
      {props.hint ? <span className="mt-1 block text-sm leading-6 text-ink-soft">{props.hint}</span> : null}
      <input
        className={fieldClass}
        name={props.name}
        defaultValue={props.defaultValue}
        type={props.type || "text"}
        required={props.required}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
      />
    </label>
  );
}

export function TextArea(props: {
  label: string;
  name: string;
  hint?: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{props.label}</span>
      {props.hint ? <span className="mt-1 block text-sm leading-6 text-ink-soft">{props.hint}</span> : null}
      <textarea
        className={`${fieldClass} leading-7`}
        name={props.name}
        defaultValue={props.defaultValue}
        rows={props.rows || 4}
        placeholder={props.placeholder}
      />
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white/80 p-5 shadow-card ${className}`}>{children}</section>;
}

export function Flash({
  saved,
  error,
  warning,
}: {
  saved?: string;
  error?: string;
  warning?: string;
}) {
  const savedMessages: Record<string, string> = {
    "1": "Saved.",
    background: "Background saved. Refresh the interview guide when you want questions based on these notes.",
    questions: "Questions updated. Anything you wrote or edited yourself was kept.",
    uploaded: "Recording saved. You can transcribe it, or paste a transcript if you already have one.",
    transcript: "Transcript saved.",
    "demo-transcript":
      "The recording is saved. Demo mode wrote a note in place of a transcript, because it cannot hear the audio.",
    draft: "A new version of the chapter is saved. Older versions are still here.",
    restored: "That version was copied forward. The older ones are still in the list.",
    sample: "The fictional sample is ready. Arthur Penrose and his family are invented.",
    deleted: "The project was deleted.",
    "signed-out": "You are signed out.",
    recording: "Recording removed.",
  };
  const warningMessages: Record<string, string> = {
    ai: "The writing service did not answer, so this used the built-in draft instead.",
    faithful: "The model added details that were not in the transcript, so this version stays with their words.",
  };
  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-md border border-clay/40 bg-white px-4 py-3 text-sm text-clay-deep" role="alert">
          {error}
        </p>
      ) : null}
      {saved && savedMessages[saved] ? (
        <p className="rounded-md border border-pine/20 bg-white px-4 py-3 text-sm text-pine" role="status">
          {savedMessages[saved]}
        </p>
      ) : null}
      {warning && warningMessages[warning] ? (
        <p className="rounded-md border border-line bg-mark/60 px-4 py-3 text-sm text-ink" role="status">
          {warningMessages[warning]}
        </p>
      ) : null}
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: string }) {
  const tones: Record<string, string> = {
    draft: "bg-pine text-paper",
    transcript: "bg-mark text-ink",
    recording: "bg-paper-3 text-ink",
    questions: "bg-paper-2 text-ink-soft",
    empty: "bg-paper-2 text-ink-faint",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.empty}`}>
      {label}
    </span>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-clay-deep underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
