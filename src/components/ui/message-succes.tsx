import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Message de réussite avec icône : jamais signalé par la couleur seule. */
export function MessageSucces({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;

  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-succes/30 bg-succes/5 p-3 text-sm text-succes",
        className,
      )}
    >
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
