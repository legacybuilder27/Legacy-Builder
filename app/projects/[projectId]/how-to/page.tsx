import Link from "next/link";
import { projectContext } from "@/lib/actions/context";
import { buttonClass } from "@/components/ui";

export default async function HowToRecordPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project } = await projectContext(projectId);
  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-serif text-4xl">How to record a call</h1>
      <p className="mt-4 text-lg leading-8 text-ink-soft">
        You do not need special gear. A phone on speaker, and something else that can record the room, is enough for a clear conversation with {project.parentName}.
      </p>
      <div className="no-print mt-6 flex flex-wrap gap-2">
        <Link href={`/projects/${project.id}/how-to/upload`} className={buttonClass("secondary")}>
          How to upload
        </Link>
        <Link href={`/projects/${project.id}/questions`} className={buttonClass("secondary")}>
          Open the guide
        </Link>
      </div>

      <Section title="Ask first">
        <p>
          Before you press record, ask. A simple line is enough: “I would like to record this so I do not miss your words. Is that all right with you?”
        </p>
        <p>
          Rules about recording calls differ by state and country. Asking is the right thing to do, and in many places it is required. If they say no, take notes, or wait for another day.
        </p>
      </Section>

      <Section title="The reliable way: speakerphone and a second device">
        <p>This works on every phone.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Call them, and put the phone on speaker.</li>
          <li>Set a second phone, a tablet, or a computer beside it. Open Voice Memos, the Android recorder, or QuickTime on a Mac.</li>
          <li>Say the permission line, then start the recorder.</li>
          <li>Keep both devices plugged in if the call may run an hour.</li>
          <li>When you hang up, play the first few seconds so you know it took.</li>
        </ol>
        <p>Sit the recorder closer to the speaker than to the fan, the television, or a hard tabletop that rattles.</p>
      </Section>

      <Section title="iPhone">
        <p>
          The Phone app does not include a call recorder in the United States. Voice Memos is excellent for a visit in the same room. For a phone call, run Voice Memos on a second device while the call is on speaker.
        </p>
        <p>
          Some call-recording apps exist. They change often, and some of them play an announcement or get blocked by the carrier. If you use one, tell them before you start. If it is fiddly, go back to the speakerphone method.
        </p>
        <p>
          FaceTime can be captured with a screen recording on some devices. Both of you should know that is happening. A second device is usually clearer and kinder.
        </p>
      </Section>

      <Section title="Android">
        <p>
          The Google Phone app can record calls in some countries and not others. If you see a record button, the other person may hear a notice. Tell them anyway, before you tap it.
        </p>
        <p>
          If you do not see a record button, use speakerphone and a second device. Some phone makers add their own recorder. The same rule applies: ask first.
        </p>
      </Section>

      <Section title="Zoom or Google Meet">
        <p>
          Start a Zoom meeting and invite them in with a link, or have them call the dial-in number. Record to your computer. Zoom tells people the meeting is being recorded, which is a good reminder to say it yourself too.
        </p>
        <p>
          Google Meet recording shows up on some Google accounts and not on others. If you do not see a record button, keep the meeting and record the room with a second device.
        </p>
      </Section>

      <Section title="In the same room">
        <p>
          A quiet room with something soft in it, a bedroom or a living room, is usually kinder to a recording than a kitchen. Put the phone on the table, closer to them than to you. Turn on Do Not Disturb.
        </p>
        <p>Record ten seconds, play it back, and then begin. Watch the battery. Do not start a long visit at 5 percent.</p>
      </Section>

      <Section title="How to run the interview">
        <ul className="list-disc space-y-2 pl-5">
          <li>One chapter per call. Half an hour to an hour is a good length. Stop while they still have a little energy.</li>
          <li>Send the questions ahead if they like time to think. Some people would rather be surprised. You know which one you have.</li>
          <li>Ask one question, then wait. The silence is not a problem you have to fill.</li>
          <li>If they wander into a good story, let it go. You can come back to the list.</li>
          <li>Useful follow-ups: “What happened next?” “Who else was there?” “What did it look like?” “How did you feel about that then?”</li>
          <li>Do not correct them in the middle of a story. Make a note and ask later.</li>
          <li>Names and dates get fuzzy. That is normal. The draft will mark spots to check.</li>
          <li>At the end, tell them what you loved hearing, and what you might ask next time.</li>
        </ul>
      </Section>

      <Section title="After you hang up">
        <p>
          Save the file somewhere you can find it, then upload it to the matching chapter. If you already have a transcript from another tool, you can paste that instead. The chapter page explains both.
        </p>
        <p className="no-print">
          <Link href={`/projects/${project.id}/how-to/upload`} className="font-semibold text-clay-deep underline-offset-4 hover:underline">
            Read the upload steps
          </Link>
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-ink">{children}</div>
    </section>
  );
}
