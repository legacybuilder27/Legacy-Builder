import Link from "next/link";
import { Shell } from "@/components/Shell";
import { buttonClass } from "@/components/ui";

const steps = [
  {
    title: "Write down what you already know",
    detail: "Where they grew up, who was in the house, the work, the stories you do not want to lose, and the topics to leave alone.",
  },
  {
    title: "Ask, one chapter at a time",
    detail: "A guide is ready even if the background is thin. Print it, call them, and let the conversation wander.",
  },
  {
    title: "Turn the recording into a chapter",
    detail: "Keep the transcript, draft a chapter in their voice, and save follow-up questions for the next call.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay-deep">For their words</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight text-ink sm:text-6xl">
          Keep a parent's stories, in their own voice.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          Legacy Builder is the working app for interviewing an aging parent. You keep the background, the questions,
          the recordings, and the chapters. Each account stays private to the person who created it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className={buttonClass()}>
            Create an account
          </Link>
          <Link href="/login" className={buttonClass("secondary")}>
            Sign in
          </Link>
          <Link href="/projects" className={buttonClass("quiet")}>
            Your projects
          </Link>
        </div>
        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-line bg-white/80 p-5 shadow-card">
              <p className="font-serif text-3xl text-clay">{index + 1}</p>
              <h2 className="mt-3 font-serif text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{step.detail}</p>
            </li>
          ))}
        </ol>
        <figure className="mt-14 max-w-3xl border-l-4 border-clay/50 pl-5">
          <blockquote className="font-serif text-2xl leading-9 text-ink">
            “We didn't have much. Mom would cut one apple into eight pieces so every kid got some. I still eat apples that way.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-ink-soft">
            A fictional excerpt. It is not a real family.
          </figcaption>
        </figure>
      </div>
    </Shell>
  );
}
