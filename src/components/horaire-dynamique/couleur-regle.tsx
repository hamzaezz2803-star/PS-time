import { CalendarClock, Check } from "lucide-react";
import { COULEURS_REGLE, type CouleurRegle } from "@/lib/constantes";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import { cn } from "@/lib/utils";

// Classes écrites en entier : Tailwind ne repère que les noms de classes complets.
const CLASSES: Record<CouleurRegle, { pastille: string; echantillon: string }> = {
  bleu: { pastille: "bg-regle-bleu-fond text-regle-bleu ring-regle-bleu/30", echantillon: "bg-regle-bleu" },
  vert: { pastille: "bg-regle-vert-fond text-regle-vert ring-regle-vert/30", echantillon: "bg-regle-vert" },
  orange: { pastille: "bg-regle-orange-fond text-regle-orange ring-regle-orange/30", echantillon: "bg-regle-orange" },
  rouge: { pastille: "bg-regle-rouge-fond text-regle-rouge ring-regle-rouge/30", echantillon: "bg-regle-rouge" },
  turquoise: { pastille: "bg-regle-turquoise-fond text-regle-turquoise ring-regle-turquoise/30", echantillon: "bg-regle-turquoise" },
  rose: { pastille: "bg-regle-rose-fond text-regle-rose ring-regle-rose/30", echantillon: "bg-regle-rose" },
  jaune: { pastille: "bg-regle-jaune-fond text-regle-jaune ring-regle-jaune/30", echantillon: "bg-regle-jaune" },
  ardoise: { pastille: "bg-regle-ardoise-fond text-regle-ardoise ring-regle-ardoise/30", echantillon: "bg-regle-ardoise" },
};

/** Pastille d'un profil reconnu, à la couleur de sa règle ; le code et le nom restent écrits (jamais la couleur seule). */
export function PastilleRegle({ couleur, code, nom }: { couleur: CouleurRegle; code: string; nom: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-sm font-semibold ring-1 ring-inset", CLASSES[couleur].pastille)}>
      <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="font-mono font-medium">{code}</span> {nom}
    </span>
  );
}

/** Choix de la couleur d'une règle : une case par couleur (nom lu par les lecteurs d'écran), avec un aperçu. */
export function ChoixCouleurRegle({ valeur, onChange, apercu }: { valeur: CouleurRegle; onChange: (couleur: CouleurRegle) => void; apercu: { code: string; nom: string } }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-texte">{textes.couleur}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {COULEURS_REGLE.map((couleur) => {
          const estChoisie = couleur === valeur;
          return (
            <label
              key={couleur}
              title={textes.nomsCouleurs[couleur]}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-lg ring-offset-2 transition-shadow duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-primaire lg:size-10",
                CLASSES[couleur].echantillon,
                estChoisie ? "ring-2 ring-marine" : "hover:ring-2 hover:ring-bordure-champ",
              )}
            >
              <input type="radio" name="couleur" value={couleur} checked={estChoisie} onChange={() => onChange(couleur)} className="sr-only" aria-label={textes.nomsCouleurs[couleur]} />
              {estChoisie && <Check className="size-5 text-white" strokeWidth={3} aria-hidden="true" />}
            </label>
          );
        })}
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm text-texte-secondaire">
        <span>{textes.apercu} :</span>
        <PastilleRegle couleur={valeur} code={apercu.code} nom={apercu.nom} />
        <span className="sr-only">{textes.couleurChoisie(textes.nomsCouleurs[valeur])}</span>
      </p>
      <p className="text-sm text-texte-secondaire">{textes.aideCouleur}</p>
    </fieldset>
  );
}
