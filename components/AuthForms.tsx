"use client";

import { useActionState } from "react";
import { login, signup } from "@/lib/actions/auth";
import { buttonClass, fieldClass } from "@/components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, { error: "" });
  return (
    <form action={action} className="space-y-4" data-testid="signup-form">
      {state.error ? (
        <p className="rounded-md border border-clay/40 bg-white px-3 py-2 text-sm text-clay-deep" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        Your name
        <input className={fieldClass} name="name" autoComplete="name" required />
      </label>
      <label className="block text-sm font-semibold">
        Email
        <input className={fieldClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <span className="mt-1 block font-normal text-ink-soft">At least 8 characters. This account is only for your projects.</span>
        <input className={fieldClass} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <button className={buttonClass()} disabled={pending}>
        {pending ? "Creating the account..." : "Create account"}
      </button>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="space-y-4" data-testid="login-form">
      <input type="hidden" name="next" value={next || ""} />
      {state.error ? (
        <p className="rounded-md border border-clay/40 bg-white px-3 py-2 text-sm text-clay-deep" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-semibold">
        Email
        <input className={fieldClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input className={fieldClass} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={buttonClass()} disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
