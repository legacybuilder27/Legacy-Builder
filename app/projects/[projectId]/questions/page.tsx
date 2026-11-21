import Link from "next/link";
import {
  addQuestion,
  deleteQuestion,
  moveQuestion,
  regenerateChapter,
  saveQuestion,
} from "@/lib/actions/questions";
import { refreshGuide } from "@/lib/actions/projects";
import { projectContext } from "@/lib/actions/context";
import { PrintButton } from "@/components/PrintButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Flash, buttonClass } from "@/components/ui";

const sourceLabel = {
  default: "Suggested",
  personalized: "From their story",
  custom: "Yours",
};

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ saved?: string; error?: string; warning?: string }>;
}) {
  const { projectId } = await params;
  const query = await searchParams;
  const { db, project } = await projectContext(projectId);
  const chapters = await db.listChapters(project.id);
  const questions = await db.listQuestionsForProject(project.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Interview guide</h1>
          <p className="mt-3 leading-7 text-ink-soft">
            One chapter per call is plenty, about 30 to 60 minutes. Edit any question. Regenerating puts the suggested questions back and keeps the ones you wrote.
          </p>
        </div>
      </div>
      <div className="no-print mt-5 flex flex-wrap gap-2">
        <Link href={`/projects/${project.id}/guide`} className={buttonClass("secondary")}>
          Open printable guide
        </Link>
        <a className={buttonClass("secondary")} href={`/api/export/${project.id}/guide?format=docx`}>
          Download Word
        </a>
        <a className={buttonClass("secondary")} href={`/api/export/${project.id}/guide?format=pdf`}>
          Download PDF
        </a>
        <form action={refreshGuide.bind(null, project.id)}>
          <SubmitButton variant="secondary" pendingLabel="Refreshing...">
            Refresh from background
          </SubmitButton>
        </form>
      </div>
      <div className="mt-6">
        <Flash saved={query.saved} error={query.error} warning={query.warning} />
      </div>
      <nav className="no-print mt-6 flex flex-wrap gap-2 text-sm">
        {chapters.map((chapter) => (
          <a key={chapter.id} href={`#${chapter.key}`} className="rounded-full bg-white px-3 py-1 text-ink-soft ring-1 ring-line hover:text-ink">
            {chapter.title}
          </a>
        ))}
      </nav>
      <div className="mt-8 space-y-10" data-testid="question-list">
        {chapters.map((chapter) => {
          const items = questions
            .filter((question) => question.chapterId === chapter.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <section key={chapter.id} id={chapter.key} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl">{chapter.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{chapter.description}</p>
                </div>
                <form action={regenerateChapter.bind(null, project.id, chapter.key)}>
                  <SubmitButton variant="quiet" pendingLabel="Regenerating...">
                    Regenerate suggested questions
                  </SubmitButton>
                </form>
              </div>
              {items.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">
                  Questions in this chapter were set aside because they touch on topics you asked to avoid. You can add your own.
                </p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {items.map((question, index) => (
                    <li key={question.id} className="rounded-xl border border-line bg-white/80 p-4">
                      <form action={saveQuestion.bind(null, project.id, chapter.key)} className="space-y-3">
                        <input type="hidden" name="questionId" value={question.id} />
                        <label className="block text-sm font-semibold text-ink-soft">
                          {index + 1}. {sourceLabel[question.source]}
                          <textarea className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 font-sans text-base font-normal leading-7 text-ink" name="text" rows={3} defaultValue={question.text} />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <SubmitButton variant="secondary" pendingLabel="Saving...">
                            Save
                          </SubmitButton>
                        </div>
                      </form>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {index > 0 ? (
                          <form action={moveQuestion.bind(null, project.id, chapter.key)}>
                            <input type="hidden" name="questionId" value={question.id} />
                            <input type="hidden" name="direction" value="up" />
                            <SubmitButton variant="quiet">Move up</SubmitButton>
                          </form>
                        ) : null}
                        {index < items.length - 1 ? (
                          <form action={moveQuestion.bind(null, project.id, chapter.key)}>
                            <input type="hidden" name="questionId" value={question.id} />
                            <input type="hidden" name="direction" value="down" />
                            <SubmitButton variant="quiet">Move down</SubmitButton>
                          </form>
                        ) : null}
                        <form action={deleteQuestion.bind(null, project.id, chapter.key)}>
                          <input type="hidden" name="questionId" value={question.id} />
                          <SubmitButton variant="quiet">Delete</SubmitButton>
                        </form>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <form action={addQuestion.bind(null, project.id, chapter.key)} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label className="block flex-1 text-sm font-semibold">
                  Add a question
                  <input className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 font-normal" name="text" placeholder="Ask this in your own words" />
                </label>
                <div className="sm:pt-7">
                  <SubmitButton variant="secondary">Add</SubmitButton>
                </div>
              </form>
            </section>
          );
        })}
      </div>
      <div className="no-print mt-10">
        <PrintButton label="Print this page" />
      </div>
    </div>
  );
}
