import Link from "next/link";
import { projectContext } from "@/lib/actions/context";
import { buttonClass } from "@/components/ui";

export default async function HowToUploadPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { db, project } = await projectContext(projectId);
  const chapters = await db.listChapters(project.id);
  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-serif text-4xl">How to add a recording or a transcript</h1>
      <p className="mt-4 leading-8 text-ink-soft">
        Each recording belongs to one chapter. A 45 minute call is welcome. If the file is large, the app sends it up in pieces.
      </p>
      <ol className="mt-8 list-decimal space-y-4 pl-5 leading-7">
        <li>Open the chapter you talked about. The list is below.</li>
        <li>Upload an m4a, mp3, or wav file. Those are the formats phones and Zoom usually give you.</li>
        <li>
          Transcribe it in the app, or paste a transcript you already have. A .txt file works too. Demo mode cannot hear the audio, so pasting is the way to try a real draft before you add an API key.
        </li>
        <li>Read the transcript and fix names while the call is fresh. Then draft the chapter.</li>
      </ol>
      <h2 className="mt-10 font-serif text-3xl">Chapters</h2>
      <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white/80">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-serif text-xl">{chapter.title}</span>
            <Link href={`/projects/${project.id}/chapters/${chapter.key}`} className={buttonClass("secondary")}>
              Open
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm leading-6 text-ink-soft">
        With an OpenAI key, transcription uses Whisper and has a limit of about 25 MB per file. Longer files can still be stored. Paste a transcript, or split the audio, if the file is over that limit. In demo mode the file is stored and nothing is sent out.
      </p>
      <p className="no-print mt-4">
        <Link href={`/projects/${project.id}/how-to`} className="font-semibold text-clay-deep underline-offset-4 hover:underline">
          Back to recording instructions
        </Link>
      </p>
    </article>
  );
}
