import Link from "next/link";
import { createSampleProject } from "@/lib/actions/projects";
import { context, publicUser } from "@/lib/actions/context";
import { Shell } from "@/components/Shell";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash, buttonClass } from "@/components/ui";
import { formatWhen, possessive } from "@/lib/text";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { db, user } = await context();
  const query = await searchParams;
  const projects = await db.listProjects(user.id);
  const counts = await Promise.all(
    projects.map(async (project) => {
      const chapters = await db.chapterCounts(project.id);
      return {
        id: project.id,
        drafts: chapters.filter((chapter) => chapter.drafts > 0).length,
        total: chapters.length,
      };
    }),
  );
  const byId = new Map(counts.map((item) => [item.id, item]));

  return (
    <Shell user={publicUser(user)}>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl">Your projects</h1>
            <p className="mt-2 max-w-xl text-ink-soft">One project per parent. You can come back to a chapter whenever you are ready.</p>
          </div>
          <Link href="/projects/new" className={buttonClass()}>
            Start a project
          </Link>
        </div>
        <div className="mt-6">
          <Flash saved={query.saved} error={query.error} />
        </div>
        {projects.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-white/70 p-6">
            <h2 className="font-serif text-2xl">No projects yet</h2>
            <p className="mt-2 max-w-xl leading-7 text-ink-soft">
              Start with one parent. If you want to see the whole loop first, open the sample. Arthur Penrose and his family are fictional.
            </p>
            <form action={createSampleProject} className="mt-4">
              <SubmitButton variant="secondary">Open the sample project</SubmitButton>
            </form>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4">
            {projects.map((project) => {
              const count = byId.get(project.id);
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="block rounded-xl border border-line bg-white/80 p-5 shadow-card hover:border-clay/40"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-serif text-3xl">{project.parentName}</h2>
                      <p className="text-sm text-ink-soft">Updated {formatWhen(project.updatedAt)}</p>
                    </div>
                    <p className="mt-2 text-ink-soft">
                      {project.relationship ? `You call them ${project.relationship}. ` : ""}
                      {count ? `${count.drafts} of ${count.total} chapters have a draft.` : ""}
                      {project.isSample ? " Fictional sample." : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {projects.length > 0 && !projects.some((project) => project.isSample) ? (
          <form action={createSampleProject} className="mt-8">
            <p className="text-sm text-ink-soft">Want to see a finished loop before you record anyone?</p>
            <div className="mt-2">
              <SubmitButton variant="secondary">Open the fictional sample</SubmitButton>
            </div>
          </form>
        ) : null}
        <p className="mt-10 text-sm text-ink-soft">
          {possessive("A second parent")} stories can live in a second project. Nothing here is shared between accounts.
        </p>
      </div>
    </Shell>
  );
}
