import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { Etiquette } from "@/components/ui/etiquette";
import { ACTIONS_HISTORIQUE, CHEMIN_HISTORIQUE, CONSERVATION_HISTORIQUE_JOURS, HISTORIQUE_JOURS_DEFAUT, HISTORIQUE_JOURS_MAX, LONGUEUR_MAX_RECHERCHE, MODULES_HISTORIQUE } from "@/lib/constantes";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { cn } from "@/lib/utils";
import { chaineHistorique, type RechercheHistorique } from "@/lib/validation/historique";

const textes = TEXTES_HISTORIQUE.filtres;
const CHAMP = "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";

type Auteur = { id: string; nom: string; identifiant: string | null };

/** Filtres de l'historique : formulaire GET (critères dans l'URL) et périodes rapides qui gardent les autres filtres. */
export function FiltresHistorique({ recherche, auteurs, aujourdhui }: { recherche: RechercheHistorique; auteurs: Auteur[]; aujourdhui: string }) {
  const periodes = [
    { libelle: textes.aujourdhui, du: aujourdhui },
    { libelle: textes.septJours, du: ajouterJours(aujourdhui, -6) },
    { libelle: textes.trenteJours, du: ajouterJours(aujourdhui, -(HISTORIQUE_JOURS_DEFAUT - 1)) },
  ];

  return (
    <section aria-label={textes.titre} className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <form action={CHEMIN_HISTORIQUE} className="grid grid-cols-[minmax(0,1fr)] items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[9.5rem_9.5rem_repeat(3,minmax(0,1fr))_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-du">{textes.du}</Etiquette>
          <input id="historique-du" name="du" type="date" defaultValue={recherche.du} max={aujourdhui} className={cn(CHAMP, "tabular-nums")} />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-au">{textes.au}</Etiquette>
          <input id="historique-au" name="au" type="date" defaultValue={recherche.au} max={aujourdhui} className={cn(CHAMP, "tabular-nums")} />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-auteur">{textes.auteur}</Etiquette>
          <select id="historique-auteur" name="auteur" defaultValue={recherche.auteurId ?? ""} className={CHAMP}>
            <option value="">{textes.tousAuteurs}</option>
            {auteurs.map((auteur) => (
              <option key={auteur.id} value={auteur.id}>{auteur.identifiant ? `${auteur.nom} (${auteur.identifiant})` : auteur.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-module">{textes.module}</Etiquette>
          <select id="historique-module" name="module" defaultValue={recherche.module ?? ""} className={CHAMP}>
            <option value="">{textes.tousModules}</option>
            {MODULES_HISTORIQUE.map((module) => (
              <option key={module} value={module}>{TEXTES_HISTORIQUE.modules[module]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-action">{textes.action}</Etiquette>
          <select id="historique-action" name="action" defaultValue={recherche.action ?? ""} className={CHAMP}>
            <option value="">{textes.toutesActions}</option>
            {ACTIONS_HISTORIQUE.map((action) => (
              <option key={action} value={action}>{TEXTES_HISTORIQUE.actions[action]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="historique-q">{textes.recherche}</Etiquette>
          <input id="historique-q" name="q" type="search" defaultValue={recherche.texte} maxLength={LONGUEUR_MAX_RECHERCHE} placeholder={textes.exempleRecherche} className={CHAMP} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-6 xl:justify-end">
          <Link
            href={CHEMIN_HISTORIQUE}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-base font-semibold text-primaire transition-colors duration-150 hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-10"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {textes.reinitialiser}
          </Link>
          <Bouton type="submit">
            <Search className="size-5" aria-hidden="true" />
            {textes.rechercher}
          </Bouton>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-bordure pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-texte">{textes.periodeRapide}</span>
          {periodes.map((periode) => {
            const estActive = periode.du === recherche.du && recherche.au === aujourdhui;
            return (
              <Link
                key={periode.libelle}
                href={`${CHEMIN_HISTORIQUE}${chaineHistorique({ ...recherche, du: periode.du, au: aujourdhui })}`}
                aria-current={estActive ? "true" : undefined}
                className={cn("inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9", estActive ? "bg-primaire text-white" : "bg-canevas text-texte hover:bg-ciel")}
              >
                {periode.libelle}
              </Link>
            );
          })}
        </div>
        <p className="text-sm text-texte-secondaire sm:ms-auto">{textes.aideLimite(HISTORIQUE_JOURS_MAX, CONSERVATION_HISTORIQUE_JOURS)}</p>
      </div>
    </section>
  );
}
