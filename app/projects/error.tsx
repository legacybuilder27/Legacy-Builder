"use client";

export default function ProjectsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-4xl">Something went wrong on this page</h1>
      <p className="mt-3 text-ink-soft">Try it again. If it keeps happening, refresh the page.</p>
      <button
        className="mt-6 rounded-md bg-clay-deep px-4 py-2 text-sm font-semibold text-paper"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
