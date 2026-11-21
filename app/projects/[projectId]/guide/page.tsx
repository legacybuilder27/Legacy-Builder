import Link from "next/link";
import { projectContext } from "@/lib/actions/context";
import { PrintButton } from "@/components/PrintButton";
import { buttonClass } from "@/components/ui";

export default async function GuidePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { db, project } = await projectContext(projectId);
  const chapters = await db.listChapters(project.id);
  const questions = await db.listQuestionsForProject(project.id);
  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <div className="no-print mb-6 flex flex-wrap gap-2">
        <Link href={`/projects/${project.id}/questions`} className={buttonClass("secondary")}>
          Back to editing
        </Link>
        <PrintButton label="Print or save as PDF" />
        <a className={buttonClass("secondary")} href={`/api/export/${project.id}/guide?format=docx`}>
          Download Word
        </a>
        <a className={buttonClass("secondary")} href={`/api/export/${project.id}/guide?format=pdf`}>
          Download PDF
        </a>
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-clay-deep">Interview guide</p>
      <h1 className="mt-2 font-serif text-5xl">{project.parentName}</h1>
      <p className="mt-4 max-w-xl leading-7 text-ink-soft">
        One chapter a conversation is plenty. Ask if it is all right to record. You do not need to get through every question.
      </p>
      {chapters.map((chapter) => {
        const items = questions
          .filter((question) => question.chapterId === chapter.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <section key={chapter.id} className="mt-10">
            <h2 className="font-serif text-3xl">{chapter.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{chapter.description}</p>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7">
              {items.map((question) => (
                <li key={question.id}>{question.text}</li>
              ))}
            </ol>
          </section>
        );
      })}
    </article>
  );
}
