import Link from "next/link";
import { FileSpreadsheet, FileText, Search } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampCalendrier } from "@/components/ui/champ-calendrier";
import { Etiquette } from "@/components/ui/etiquette";
import { CHEMIN_ETAT, CHEMIN_EXPORT_ETAT, CHEMIN_IMPRESSION_ETAT, LONGUEUR_MAX_RECHERCHE, RAPPORT_JOURS_DEFAUT, RAPPORT_JOURS_MAX } from "@/lib/constantes";
import { aplatirArbre, construireArbre, type ElementArbre } from "@/lib/metier/arbre";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import type { Etat } from "@/lib/metier/etats";
import { periodeRapide } from "@/lib/metier/rapport-presences";
import { TEXTES_ETATS } from "@/lib/textes/etats";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import { cn } from "@/lib/utils";
import { chaineEtat, type RechercheEtat } from "@/lib/validation/etats";

const textes = TEXTES_RAPPORT.filtres;
const CHAMP = "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";
const LIEN_EXPORT = "inline-flex min-h-11 items-center gap-2 rounded-lg border bg-surface px-3.5 text-sm font-semibold shadow-carte transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10";

/**
 * Filtres d'un état : formulaire GET (critères dans l'URL : période, département, employé),
 * périodes rapides qui gardent les autres critères, exports Excel et PDF avec les mêmes critères.
 */
export function FiltresEtat({ etat, recherche, departements, aujourdhui }: { etat: Etat; recherche: RechercheEtat; departements: ElementArbre[]; aujourdhui: string }) {
  const requete = chaineEtat(recherche);
  const periodes = [
    { libelle: textes.ceMois, ...periodeRapide("mois", aujourdhui) },
    { libelle: textes.septJours, ...periodeRapide("semaine", aujourdhui) },
    { libelle: textes.trenteJours, du: ajouterJours(aujourdhui, -(RAPPORT_JOURS_DEFAUT - 1)), au: aujourdhui },
  ];

  return (
    <section aria-label={TEXTES_ETATS.filtres.titre} className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <form action={CHEMIN_ETAT(etat)} className="grid grid-cols-[minmax(0,1fr)] items-end gap-3 sm:grid-cols-2 lg:grid-cols-[10rem_10rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="etat-du">{textes.du}</Etiquette>
          <ChampCalendrier id="etat-du" name="du" libelle={textes.du} defaultValue={recherche.du} max={aujourdhui} aujourdhui={aujourdhui} required />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="etat-au">{textes.au}</Etiquette>
          <ChampCalendrier id="etat-au" name="au" libelle={textes.au} defaultValue={recherche.au} max={aujourdhui} aujourdhui={aujourdhui} required />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="etat-departement">{textes.departement}</Etiquette>
          <select id="etat-departement" name="departement" defaultValue={recherche.departementId ?? ""} className={CHAMP}>
            <option value="">{textes.tousDepartements}</option>
            {aplatirArbre(construireArbre(departements)).map((departement) => (
              <option key={departement.id} value={departement.id}>{" ".repeat(departement.profondeur * 4) + departement.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="etat-employe">{TEXTES_ETATS.filtres.employe}</Etiquette>
          <input id="etat-employe" name="employe" type="search" defaultValue={recherche.employe} maxLength={LONGUEUR_MAX_RECHERCHE} placeholder={TEXTES_ETATS.filtres.exempleEmploye} autoComplete="off" className={CHAMP} />
        </div>
        <Bouton type="submit" className="w-full lg:w-fit">
          <Search className="size-5" aria-hidden="true" />
          {textes.rechercher}
        </Bouton>
      </form>
      <p className="-mt-2 text-sm text-texte-secondaire">{textes.aideLimite(RAPPORT_JOURS_MAX)}</p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-bordure pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-texte">{textes.periodeRapide}</span>
          {periodes.map((periode) => {
            const estActive = periode.du === recherche.du && periode.au === recherche.au;
            return (
              <Link
                key={periode.libelle}
                href={`${CHEMIN_ETAT(etat)}${chaineEtat({ ...recherche, du: periode.du, au: periode.au })}`}
                aria-current={estActive ? "true" : undefined}
                className={cn("inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9", estActive ? "bg-primaire text-white" : "bg-canevas text-texte hover:bg-ciel")}
              >
                {periode.libelle}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 sm:ms-auto">
          <a href={`${CHEMIN_EXPORT_ETAT(etat)}${requete}`} download className={cn(LIEN_EXPORT, "border-succes/40 text-succes hover:bg-succes/5")}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            {TEXTES_RAPPORT.exporter.excel}
          </a>
          <a href={`${CHEMIN_IMPRESSION_ETAT(etat)}${requete}`} className={cn(LIEN_EXPORT, "border-erreur/40 text-erreur hover:bg-erreur/5")}>
            <FileText className="size-4" aria-hidden="true" />
            {TEXTES_RAPPORT.exporter.pdf}
          </a>
        </div>
      </div>
    </section>
  );
}
