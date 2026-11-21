import Link from "next/link";
import { refreshGuide, saveBackground } from "@/lib/actions/projects";
import { projectContext } from "@/lib/actions/context";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Flash, TextArea, buttonClass } from "@/components/ui";

export default async function BackgroundPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { projectId } = await params;
  const query = await searchParams;
  const { project } = await projectContext(projectId);
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-serif text-4xl">Background</h1>
      <p className="mt-3 leading-7 text-ink-soft">
        Write what you already know. Blank fields are fine. Topics to avoid and your private notes stay off the printed guide.
      </p>
      <div className="mt-6">
        <Flash saved={query.saved} error={query.error} />
      </div>
      <form action={saveBackground.bind(null, project.id)} className="mt-6 space-y-6" data-testid="background-form">
        <Field label="Name on the chapters" name="parentName" defaultValue={project.parentName} required />
        <Field label="What you call them" name="relationship" defaultValue={project.relationship} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Birth year" name="birthYear" defaultValue={project.birthYear} />
          <Field label="Birth place" name="birthPlace" defaultValue={project.birthPlace} />
        </div>
        <TextArea
          label="Where they grew up"
          name="grewUp"
          defaultValue={project.grewUp}
          hint="Towns, houses, who lived nearby."
        />
        <TextArea
          label="Family members"
          name="familyMembers"
          defaultValue={project.familyMembers}
          hint="Parents, siblings, and anyone else who belonged in the house. One per line works well."
        />
        <TextArea label="Schooling" name="schooling" defaultValue={project.schooling} />
        <TextArea label="Career" name="career" defaultValue={project.career} hint="Jobs, workplaces, and about how long they stayed." />
        <TextArea
          label="Military service"
          name="military"
          defaultValue={project.military}
          hint="Branch, what they did, where they were stationed, and the years. Leave this blank if they did not serve."
        />
        <TextArea
          label="Faith"
          name="faith"
          defaultValue={project.faith}
          hint="A congregation, a practice, or a note that they were not religious. Whatever is true."
        />
        <TextArea label="Hobbies" name="hobbies" defaultValue={project.hobbies} />
        <TextArea
          label="Big life events"
          name="lifeEvents"
          defaultValue={project.lifeEvents}
          hint="Moves, losses, marriages, recoveries. The moments you already know mattered."
        />
        <TextArea
          label="What you want covered"
          name="wantCovered"
          defaultValue={project.wantCovered}
          hint="Stories you hope make it into the chapters."
        />
        <TextArea
          label="Topics to avoid"
          name="avoidTopics"
          defaultValue={project.avoidTopics}
          hint="Only you see this. It is left off the printed guide. Questions that touch these topics are skipped."
        />
        <TextArea
          label="Private notes"
          name="notes"
          defaultValue={project.notes}
          hint="Health, timing, names you are unsure how to spell. These stay in the app and are not turned into questions."
        />
        <SubmitButton>Save background</SubmitButton>
      </form>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <form action={refreshGuide.bind(null, project.id)}>
          <SubmitButton variant="secondary" pendingLabel="Refreshing questions...">
            Refresh questions from this background
          </SubmitButton>
        </form>
        <Link href={`/projects/${project.id}/questions`} className={buttonClass("quiet")}>
          Go to the guide
        </Link>
      </div>
    </div>
  );
}
