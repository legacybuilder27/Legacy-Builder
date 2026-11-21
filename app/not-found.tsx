import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="mx-auto max-w-xl px-5 py-20">
        <h1 className="font-serif text-4xl">That page is not here</h1>
        <p className="mt-3 text-ink-soft">It may have been moved, or it belongs to another account.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-clay-deep underline-offset-4 hover:underline">
          Back to the start
        </Link>
      </div>
    </Shell>
  );
}
