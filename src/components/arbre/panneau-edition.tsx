import type { ReactNode } from "react";
import { MessageSucces } from "@/components/ui/message-succes";

/** Panneau de droite : titre, résumé de l'élément choisi, message de réussite, puis le contenu. */
export function PanneauEdition({
  titre,
  resume,
  messageSucces,
  children,
}: {
  titre: string;
  resume: string[];
  messageSucces?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface" aria-labelledby="titre-formulaire">
      <div className="border-b border-bordure px-5 py-4 sm:px-6">
        <h2 id="titre-formulaire" className="truncate text-lg font-semibold text-marine">
          {titre}
        </h2>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-texte-secondaire">
          {resume.map((element) => (
            <li key={element}>{element}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <MessageSucces message={messageSucces} />
        {children}
      </div>
    </section>
  );
}
