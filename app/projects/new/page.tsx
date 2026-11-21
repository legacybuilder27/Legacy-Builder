import { createProject } from "@/lib/actions/projects";
import { context, publicUser } from "@/lib/actions/context";
import { Shell } from "@/components/Shell";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Flash } from "@/components/ui";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user } = await context();
  const query = await searchParams;
  return (
    <Shell user={publicUser(user)}>
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-4xl">Start a project</h1>
        <p className="mt-3 leading-7 text-ink-soft">
          A name is enough to begin. You can fill in the rest of the background on the next page.
        </p>
        <div className="mt-6">
          <Flash error={query.error} />
        </div>
        <form action={createProject} className="mt-6 space-y-5 rounded-xl border border-line bg-white/80 p-5 shadow-card" data-testid="new-project-form">
          <Field label="Parent's name" name="parentName" required placeholder="Example: Elena Vasquez" autoComplete="off" />
          <Field
            label="What do you call them?"
            name="relationship"
            hint="Mom, Dad, Papa, Nana. Whatever you actually say."
            placeholder="Dad"
          />
          <Field label="Birth year" name="birthYear" hint="A year is enough. The exact date can wait." placeholder="1948" />
          <Field label="Where they were born" name="birthPlace" placeholder="A town, a hospital, a farmhouse" />
          <SubmitButton>Create project</SubmitButton>
        </form>
      </div>
    </Shell>
  );
}
