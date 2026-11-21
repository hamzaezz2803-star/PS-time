import type { ReactNode } from "react";

/** Section en carte de la page Sauvegarde : titre, description, contenu. */
export function CarteSauvegarde({ id, titre, description, children }: { id: string; titre: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-lg font-semibold text-marine">
          {titre}
        </h2>
        <p className="text-base text-texte-secondaire">{description}</p>
      </div>
      {children}
    </section>
  );
}
