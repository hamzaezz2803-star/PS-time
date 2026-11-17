import { JOURS_ISO } from "@/lib/metier/horaire-dynamique";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import { cn } from "@/lib/utils";

/** Les 7 jours en lettres (L M M J V S D), les jours de la règle mis en avant ; lu en clair par les lecteurs d'écran. */
export function JoursSemaine({ jours }: { jours: number[] }) {
  const noms = JOURS_ISO.filter((jour) => jours.includes(jour)).map((jour) => textes.joursLongs[jour - 1]);
  return (
    <span className="relative inline-flex gap-1">
      <span className="sr-only">{textes.joursActifs(noms)}</span>
      {JOURS_ISO.map((jour) => {
        const estActif = jours.includes(jour);
        return (
          <span
            key={jour}
            aria-hidden="true"
            className={cn(
              "flex size-6 items-center justify-center rounded-md text-xs font-semibold",
              estActif ? "bg-primaire text-white" : "bg-fond text-texte-secondaire/60 ring-1 ring-inset ring-bordure line-through",
            )}
          >
            {textes.joursCourts[jour - 1]}
          </span>
        );
      })}
    </span>
  );
}
