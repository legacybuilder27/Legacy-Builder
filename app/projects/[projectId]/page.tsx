import Link from "next/link";
import { deleteProject } from "@/lib/actions/projects";
import { projectContext } from "@/lib/actions/context";
import { chapterProgress } from "@/lib/chapters/progress";
import { backgroundRichness } from "@/lib/questions/personalize";
import { nextStep } from "@/lib/projects/nextStep";
import { toBackground } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash, StatusPill, buttonClass } from "@/components/ui";

export default async function ProjectOverview({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { projectId } = await params;
  const query = await searchParams;
  const { db, project } = await projectContext(projectId);
  const chapters = await db.listChapters(project.id);
  const counts = await db.chapterCounts(project.id);
  const byKey = new Map(counts.map((count) => [count.key, count]));
  const step = nextStep({
    projectId: project.id,
    richness: backgroundRichness(toBackground(project)),
    chapters: chapters.map((chapter) => {
      const count = byKey.get(chapter.key);
      return {
        key: chapter.key,
        title: chapter.title,
        transcripts: count?.transcripts || 0,
        drafts: count?.drafts || 0,
      };
    }),
  });
  const drafted = counts.filter((count) => count.drafts > 0).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-clay-deep">
        {project.isSample ? "Fictional sample" : "Parent project"}
      </p>
      <h1 className="mt-2 font-serif text-5xl" data-testid="project-name">
        {project.parentName}
      </h1>
      <p className="mt-3 text-ink-soft">
        {project.relationship ? `You call them ${project.relationship}. ` : ""}
        {[project.birthYear, project.birthPlace].filter(Boolean).join(", ")}
      </p>
      {project.isSample ? (
        <p className="mt-4 max-w-2xl rounded-md bg-mark/70 px-4 py-3 text-sm leading-6">
          Arthur Penrose, Ruth, and everyone else in this project are invented. Use it to click through the loop. Your real projects stay separate.
        </p>
      ) : null}
      <div className="mt-6">
        <Flash saved={query.saved} error={query.error} />
      </div>
      <section className="mt-8 rounded-xl border border-line bg-white/80 p-5 shadow-card">
        <h2 className="font-serif text-2xl">Next</h2>
        <p className="mt-2 text-lg">{step.title}</p>
        <p className="mt-1 text-ink-soft">{step.detail}</p>
        <Link href={step.href} className={`${buttonClass()} mt-4`}>
          Continue
        </Link>
      </section>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white/70 px-4 py-3">
          <dt className="text-sm text-ink-soft">Chapters drafted</dt>
          <dd className="font-serif text-3xl">{drafted} of {chapters.length}</dd>
        </div>
        <div className="rounded-xl border border-line bg-white/70 px-4 py-3">
          <dt className="text-sm text-ink-soft">Recordings</dt>
          <dd className="font-serif text-3xl">{counts.reduce((sum, count) => sum + count.recordings, 0)}</dd>
        </div>
        <div className="rounded-xl border border-line bg-white/70 px-4 py-3">
          <dt className="text-sm text-ink-soft">Transcripts</dt>
          <dd className="font-serif text-3xl">{counts.reduce((sum, count) => sum + count.transcripts, 0)}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-serif text-3xl">Chapters</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white/80">
        {chapters.map((chapter) => {
          const count = byKey.get(chapter.key);
          const progress = chapterProgress({
            questionCount: count?.questions || 0,
            recordingCount: count?.recordings || 0,
            transcriptCount: count?.transcripts || 0,
            draftCount: count?.drafts || 0,
          });
          return (
            <li key={chapter.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <Link href={`/projects/${project.id}/chapters/${chapter.key}`} className="font-serif text-2xl hover:text-clay-deep">
                  {chapter.title}
                </Link>
                <p className="text-sm text-ink-soft">{chapter.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill label={progress.label} tone={progress.key} />
                <Link href={`/projects/${project.id}/chapters/${chapter.key}`} className="text-sm font-semibold text-clay-deep">
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      <details className="mt-10 rounded-xl border border-line bg-white/60 p-4">
        <summary className="cursor-pointer font-semibold">Delete this project</summary>
        <form action={deleteProject.bind(null, project.id)} className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-ink-soft">
            This removes the background, questions, recordings, transcripts, and drafts for {project.parentName}. It cannot be undone.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" required />
            Yes, delete this project
          </label>
          <SubmitButton variant="danger">Delete project</SubmitButton>
        </form>
      </details>
    </div>
  );
}
