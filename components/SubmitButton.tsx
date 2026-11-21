"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui";

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button className={buttonClass(variant)} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
