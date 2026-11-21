import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { authSecretIsDefault } from "@/lib/auth/token";
import { describeAi, footerNote } from "@/lib/ai/mode";
import { SubmitButton } from "@/components/SubmitButton";
import type { PublicUser } from "@/lib/actions/context";

export function Shell({
  user,
  children,
}: {
  user?: PublicUser | null;
  children: React.ReactNode;
}) {
  const note = footerNote(describeAi());
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="no-print border-b border-line/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href={user ? "/projects" : "/"} className="font-serif text-2xl tracking-tight text-ink">
            Legacy Builder
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="hidden text-ink-soft sm:inline">{user.name}</span>
                <form action={logout}>
                  <SubmitButton variant="quiet">Sign out</SubmitButton>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="font-semibold text-ink">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-md bg-clay-deep px-3 py-2 font-semibold text-paper">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="no-print mx-auto max-w-5xl px-5 py-10 text-sm leading-6 text-ink-soft">
        <p>{note}</p>
        {authSecretIsDefault() && process.env.NODE_ENV === "production" ? (
          <p className="mt-2">Set AUTH_SECRET before anyone else uses this site.</p>
        ) : null}
      </footer>
    </div>
  );
}

