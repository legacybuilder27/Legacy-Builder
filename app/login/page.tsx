import Link from "next/link";
import { LoginForm } from "@/components/AuthForms";
import { Shell } from "@/components/Shell";
import { Flash } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <Shell>
      <div className="mx-auto max-w-md px-5 py-14">
        <h1 className="font-serif text-4xl">Sign in</h1>
        <p className="mt-3 text-ink-soft">Use the email and password for your Legacy Builder account.</p>
        <div className="mt-6">
          <Flash saved={query.saved} error={query.error} />
        </div>
        <div className="mt-6 rounded-xl border border-line bg-white/80 p-5 shadow-card">
          <LoginForm next={query.next} />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          New here? <Link href="/signup" className="font-semibold text-clay-deep underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </div>
    </Shell>
  );
}
