import Link from "next/link";
import { SignupForm } from "@/components/AuthForms";
import { Shell } from "@/components/Shell";

export default function SignupPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-5 py-14">
        <h1 className="font-serif text-4xl">Create an account</h1>
        <p className="mt-3 leading-7 text-ink-soft">
          Your projects stay on this account. A parent does not need an account of their own.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-white/80 p-5 shadow-card">
          <SignupForm />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Already have one? <Link href="/login" className="font-semibold text-clay-deep underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </div>
    </Shell>
  );
}
