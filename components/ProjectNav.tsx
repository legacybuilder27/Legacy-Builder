"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const current = pathname.includes("/background")
    ? "background"
    : pathname.includes("/questions") || pathname.includes("/guide")
      ? "questions"
      : pathname.includes("/how-to/upload")
        ? "upload"
        : pathname.includes("/how-to")
          ? "howto"
          : "overview";
  const links = [
    ["overview", "Overview", `/projects/${projectId}`],
    ["background", "Background", `/projects/${projectId}/background`],
    ["questions", "Interview guide", `/projects/${projectId}/questions`],
    ["howto", "How to record", `/projects/${projectId}/how-to`],
    ["upload", "How to upload", `/projects/${projectId}/how-to/upload`],
  ];
  return (
    <nav className="no-print border-b border-line bg-white/50">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3">
        {links.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
              current === key ? "border-clay-deep text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
            aria-current={current === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
