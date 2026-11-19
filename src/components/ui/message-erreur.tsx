import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageErreurProps = {
  id?: string;
  message?: string;
  className?: string;
};

/** Message d'erreur avec icône : l'erreur n'est jamais signalée par la couleur seule. */
export function MessageErreur({ id, message, className }: MessageErreurProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      data-erreur
      className={cn("flex items-start gap-2 text-sm text-erreur", className)}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
