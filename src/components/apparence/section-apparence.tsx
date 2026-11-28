import type { ReactNode } from "react";
import { MessageErreur } from "@/components/ui/message-erreur";

/** Groupe de choix de la page Apparence : titre, cartes, puis l'erreur éventuelle. */
export function Section({ titre, erreur, children }: { titre: string; erreur?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold text-marine">{titre}</legend>
      {children}
      <MessageErreur message={erreur} />
    </fieldset>
  );
}
