import type { ReactNode } from "react";
import { MessageErreur } from "@/components/ui/message-erreur";

/** Groupe de choix de la page Apparence : titre, aide sous le titre, cartes, puis l'erreur éventuelle. */
export function Section({ id, titre, aide, erreur, children }: { id: string; titre: string; aide: string; erreur?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={`aide-${id}`}>
      <legend className="text-lg font-semibold text-marine">{titre}</legend>
      <p id={`aide-${id}`} className="-mt-1 text-sm text-texte-secondaire">{aide}</p>
      {children}
      <MessageErreur message={erreur} />
    </fieldset>
  );
}
