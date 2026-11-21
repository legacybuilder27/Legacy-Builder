import Link from "next/link";
import {
  deleteRecording,
  deleteTranscript,
  generateDraft,
  insertSampleTranscript,
  restoreDraft,
  saveDraftEdits,
  saveTranscript,
  transcribeRecording,
  uploadTranscriptFile,
} from "@/lib/actions/chapters";
import { chapterContext } from "@/lib/actions/context";
import { DEMO_TRANSCRIPT_MARKER } from "@/lib/draft/draftChapter";
import { formatWhen } from "@/lib/text";
import { PrintButton } from "@/components/PrintButton";
import { SubmitButton } from "@/components/SubmitButton";
import { UploadRecording } from "@/components/UploadRecording";
import { Flash, buttonClass, fieldClass } from "@/components/ui";

const sourceLabel = {
  generate: "First draft",
  regenerate: "Regenerated",
  edit: "Edited",
  restore: "Restored",
};

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; chapterKey: string }>;
  searchParams: Promise<{ saved?: string; error?: string; warning?: string; left?: string; right?: string }>;
}) {
  const { projectId, chapterKey } = await params;
  const query = await searchParams;
  const { db, project, chapter } = await chapterContext(projectId, chapterKey);
  const questions = (await db.listQuestions(chapter.id)).sort((a, b) => a.sortOrder - b.sortOrder);
  const recordings = await db.listRecordings(chapter.id);
  const transcripts = await db.listTranscripts(chapter.id);
  const drafts = await db.listDrafts(chapter.id);
  const latest = drafts[drafts.length - 1];
  const left = drafts.find((draft) => String(draft.version) === query.left);
  const right = drafts.find((draft) => String(draft.version) === query.right);
  const followUps = transcripts.filter((transcript) => transcript.kind === "followup");

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-clay-deep">{project.parentName}</p>
      <h1 className="mt-2 font-serif text-5xl">{chapter.title}</h1>
      <p className="mt-3 leading-7 text-ink-soft">{chapter.description}</p>
      <div className="mt-5">
        <Flash saved={query.saved} error={query.error} warning={query.warning} />
      </div>

      <details className="no-print mt-6 rounded-xl border border-line bg-white/70 p-4">
        <summary className="cursor-pointer font-semibold">Tips for this call</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>One chapter, about 30 to 60 minutes. Let them wander.</li>
          <li>Ask if you can record before you start.</li>
          <li>When a story pauses, try: “What happened next?” “Who else was there?” “What did it look like?”</li>
          <li>
            <Link href={`/projects/${project.id}/how-to`} className="font-semibold text-clay-deep">
              Full recording instructions
            </Link>
          </li>
        </ul>
        {project.notes ? (
          <p className="mt-3 rounded-md bg-paper px-3 py-2 text-sm leading-6">
            <span className="font-semibold">Your notes. </span>
            {project.notes}
          </p>
        ) : null}
      </details>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Questions</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-7">
          {questions.map((question) => (
            <li key={question.id}>{question.text}</li>
          ))}
        </ol>
        <Link href={`/projects/${project.id}/questions#${chapter.key}`} className="mt-3 inline-block text-sm font-semibold text-clay-deep">
          Edit questions
        </Link>
      </section>

      <section className="no-print mt-10 rounded-xl border border-line bg-white/80 p-5">
        <h2 className="font-serif text-3xl">Recordings</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Upload the call for this chapter. m4a, mp3, and wav are all fine, including a long conversation.
        </p>
        <div className="mt-4">
          <UploadRecording projectId={project.id} chapterId={chapter.id} chapterKey={chapter.key} />
        </div>
        <ul className="mt-6 space-y-4">
          {recordings.map((recording) => (
            <li key={recording.id} className="rounded-lg border border-line p-3">
              <p className="font-semibold">{recording.filename}</p>
              <p className="text-sm text-ink-soft">
                {Math.max(1, Math.round(recording.byteSize / 1024 / 1024))} MB · {formatWhen(recording.createdAt)}
              </p>
              <audio className="mt-3 w-full" controls preload="none" src={`/api/recordings/${recording.id}`} />
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={transcribeRecording.bind(null, project.id, chapter.key)}>
                  <input type="hidden" name="recordingId" value={recording.id} />
                  <SubmitButton variant="secondary" pendingLabel="Transcribing...">
                    Transcribe
                  </SubmitButton>
                </form>
                <form action={deleteRecording.bind(null, project.id, chapter.key)}>
                  <input type="hidden" name="recordingId" value={recording.id} />
                  <SubmitButton variant="quiet">Remove</SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Transcript</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Paste what they said, or upload a .txt file. The draft uses these words and does not invent a life to fill the gaps.
        </p>
        <div className="mt-4 space-y-4">
          {transcripts.map((transcript) => (
            <article key={transcript.id} className="rounded-xl border border-line bg-white/80 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{transcript.title}</h3>
                <p className="text-sm text-ink-soft">
                  {transcript.kind === "followup" ? "Follow-up" : "Interview"} · {formatWhen(transcript.updatedAt)}
                </p>
              </div>
              {transcript.content.includes(DEMO_TRANSCRIPT_MARKER) ? (
                <p className="mt-2 text-sm text-clay-deep">This is a demo note, not a transcript of the recording.</p>
              ) : null}
              {transcript.title === "Fictional sample transcript" ? (
                <p className="mt-2 text-sm text-ink-soft">This sample is invented. Delete it before you paste your parent's words.</p>
              ) : null}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-clay-deep">Read or edit</summary>
                <form action={saveTranscript.bind(null, project.id, chapter.key)} className="mt-3 space-y-3">
                  <input type="hidden" name="transcriptId" value={transcript.id} />
                  <input className={fieldClass} name="title" defaultValue={transcript.title} />
                  <label className="block text-sm">
                    <span className="font-semibold">Kind</span>
                    <select className={fieldClass} name="kind" defaultValue={transcript.kind}>
                      <option value="interview">Interview</option>
                      <option value="followup">Follow-up answers</option>
                    </select>
                  </label>
                  <textarea className={`${fieldClass} font-serif leading-7`} name="content" rows={10} defaultValue={transcript.content} />
                  <SubmitButton variant="secondary">Save transcript</SubmitButton>
                </form>
                <form action={deleteTranscript.bind(null, project.id, chapter.key)} className="mt-2">
                  <input type="hidden" name="transcriptId" value={transcript.id} />
                  <SubmitButton variant="quiet">Delete transcript</SubmitButton>
                </form>
              </details>
            </article>
          ))}
        </div>
        <form action={saveTranscript.bind(null, project.id, chapter.key)} className="no-print mt-4 space-y-3 rounded-xl border border-line bg-white/70 p-4" data-testid="paste-transcript">
          <h3 className="font-semibold">Paste a transcript</h3>
          <input className={fieldClass} name="title" placeholder="Title, optional" />
          <label className="block text-sm">
            <span className="font-semibold">Kind</span>
            <select className={fieldClass} name="kind" defaultValue="interview">
              <option value="interview">Interview</option>
              <option value="followup">Follow-up answers</option>
            </select>
          </label>
          <textarea className={`${fieldClass} font-serif leading-7`} name="content" rows={8} placeholder="Paste their words here." />
          <SubmitButton>Save transcript</SubmitButton>
        </form>
        <form action={uploadTranscriptFile.bind(null, project.id, chapter.key)} className="no-print mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">
            Or upload a .txt file
            <input className="mt-2 block text-sm font-normal" type="file" name="file" accept=".txt,text/plain" required />
          </label>
          <SubmitButton variant="secondary">Upload text</SubmitButton>
        </form>
        {project.isSample ? null : (
          <form action={insertSampleTranscript.bind(null, project.id, chapter.key)} className="no-print mt-3">
            <SubmitButton variant="quiet">Insert a fictional sample transcript</SubmitButton>
          </form>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Chapter draft</h2>
        {latest ? (
          <>
            <article className="mt-4 hidden print:block" data-testid="draft-content">
              {latest.content.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="mb-4 font-serif text-lg leading-8">
                  {paragraph}
                </p>
              ))}
            </article>
            <form action={saveDraftEdits.bind(null, project.id, chapter.key)} className="no-print mt-4 space-y-3">
              <textarea
                className={`${fieldClass} font-serif text-lg leading-8`}
                name="content"
                rows={16}
                defaultValue={latest.content}
                data-testid="draft-editor"
              />
              <label className="block text-sm font-semibold">
                Follow-up questions, one per line
                <textarea className={fieldClass} name="followUps" rows={5} defaultValue={latest.followUps.join("\n")} />
              </label>
              <div className="flex flex-wrap gap-2">
                <SubmitButton pendingLabel="Saving version...">Save this version</SubmitButton>
                <PrintButton label="Print or save as PDF" />
                <a className={buttonClass("secondary")} href={`/api/export/${project.id}/chapters/${chapter.key}?format=docx`}>
                  Download Word
                </a>
                <a className={buttonClass("secondary")} href={`/api/export/${project.id}/chapters/${chapter.key}?format=pdf`}>
                  Download PDF
                </a>
              </div>
            </form>
            {latest.followUps.length ? (
              <div className="mt-6">
                <h3 className="font-serif text-2xl">For the next call</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 leading-7">
                  {latest.followUps.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-ink-soft">No draft yet. Add a transcript, then draft the chapter from their words.</p>
        )}

        <form action={generateDraft.bind(null, project.id, chapter.key)} className="no-print mt-6 space-y-3 rounded-xl border border-line bg-paper-2/60 p-4">
          <h3 className="font-semibold">{latest ? "Regenerate" : "Draft this chapter"}</h3>
          <p className="text-sm leading-6 text-ink-soft">
            A new version is built from the transcripts. Try “make it shorter”, or fold in follow-up answers. The app will not add facts they did not say. Earlier versions stay in the list.
          </p>
          <textarea className={fieldClass} name="notes" rows={3} placeholder="Optional note, such as: make it shorter" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="includeFollowUps" value="yes" defaultChecked={followUps.length > 0 && Boolean(latest)} />
            Fold in follow-up answers ({followUps.length} saved)
          </label>
          <SubmitButton pendingLabel="Drafting...">{latest ? "Regenerate chapter" : "Draft this chapter"}</SubmitButton>
        </form>
      </section>

      <section className="no-print mt-10" data-testid="version-list">
        <h2 className="font-serif text-3xl">Versions</h2>
        {drafts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Versions show up here after the first draft.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {[...drafts].reverse().map((draft) => (
                <li key={draft.id} className="rounded-xl border border-line bg-white/80 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      Version {draft.version} · {sourceLabel[draft.source]}
                    </p>
                    <p className="text-sm text-ink-soft">{formatWhen(draft.createdAt)}</p>
                  </div>
                  {draft.revisionNotes ? <p className="mt-1 text-sm text-ink-soft">{draft.revisionNotes}</p> : null}
                  {draft.restoredFromVersion ? (
                    <p className="mt-1 text-sm text-ink-soft">Copied from version {draft.restoredFromVersion}.</p>
                  ) : null}
                  <p className="mt-3 line-clamp-6 whitespace-pre-line font-serif leading-7">{draft.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a className={buttonClass("quiet")} href={`/api/export/${project.id}/chapters/${chapter.key}?format=docx&version=${draft.version}`}>
                      Word
                    </a>
                    {draft.version !== latest?.version ? (
                      <form action={restoreDraft.bind(null, project.id, chapter.key)}>
                        <input type="hidden" name="version" value={draft.version} />
                        <SubmitButton variant="secondary">Restore this version</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {drafts.length > 1 ? (
              <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold">
                  Compare
                  <select className={fieldClass} name="left" defaultValue={query.left || String(drafts[0].version)}>
                    {drafts.map((draft) => (
                      <option key={draft.id} value={draft.version}>
                        Version {draft.version}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  with
                  <select className={fieldClass} name="right" defaultValue={query.right || String(latest?.version || "")}>
                    {drafts.map((draft) => (
                      <option key={draft.id} value={draft.version}>
                        Version {draft.version}
                      </option>
                    ))}
                  </select>
                </label>
                <button className={buttonClass("secondary")}>Show both</button>
              </form>
            ) : null}
            {left && right ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CompareColumn title={`Version ${left.version}`} content={left.content} other={right.content} />
                <CompareColumn title={`Version ${right.version}`} content={right.content} other={left.content} />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function CompareColumn({ title, content, other }: { title: string; content: string; other: string }) {
  const otherSet = new Set(other.split(/\n{2,}/).map((paragraph) => paragraph.trim()));
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 space-y-3">
        {content.split(/\n{2,}/).map((paragraph, index) => (
          <p
            key={index}
            className={`font-serif text-sm leading-6 ${otherSet.has(paragraph.trim()) ? "" : "bg-mark px-1"}`}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
