"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { modifierCouleursPlanning } from "@/app/(connecte)/administration/apparence/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { CLASSES_PALETTE } from "@/components/ui/palette";
import { COULEURS_REGLE } from "@/lib/constantes";
import { TEINTES_PAR_DEFAUT, cleChoixCouleur, estCouleurRegle, type ChoixCouleur, type CodeAColorer, type CodesAColorer } from "@/lib/metier/couleurs-planning";
import { TEXTES_APPARENCE } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_APPARENCE.couleursPlanning;
const ETAT_INITIAL: EtatFormulaire = {};
const CHAMP = "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";
const GRILLE = "grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[4rem_minmax(0,1fr)_11rem_5rem]";

/** Classes de l'aperçu : la couleur choisie, sinon celle du type (comme dans le planning). */
function classesApercu(genre: ChoixCouleur["genre"], code: CodeAColorer, couleur: string): string {
  if (estCouleurRegle(couleur)) return cn(CLASSES_PALETTE[couleur].teinte, CLASSES_PALETTE[couleur].bordure);
  if (genre === "evenement" && (code.type === "absence" || code.type === "presence")) {
    const teinte = TEINTES_PAR_DEFAUT[code.type];
    return cn(CLASSES_PALETTE[teinte].teinte, CLASSES_PALETTE[teinte].bordure);
  }
  return "border-bordure bg-surface text-marine";
}

function LigneCode({ genre, code, couleur, onChange }: { genre: ChoixCouleur["genre"]; code: CodeAColorer; couleur: string; onChange: (valeur: string) => void }) {
  const nom = cleChoixCouleur(genre, code.id);
  return (
    <li className={cn(GRILLE, "border-t border-bordure py-3 first:border-t-0")}>
      <span className="font-mono text-base font-semibold text-marine">{code.code}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base text-texte">{code.nom}</span>
        <span className="text-sm text-texte-secondaire">{textes.types[code.type] ?? code.type}</span>
      </span>
      <select name={nom} value={couleur} onChange={(evenement) => onChange(evenement.target.value)} aria-label={textes.couleurDe(code.code, code.nom)} className={cn(CHAMP, "col-start-2 sm:col-start-auto")}>
        <option value="">{textes.selonType}</option>
        {COULEURS_REGLE.map((teinte) => (
          <option key={teinte} value={teinte}>{TEXTES_APPARENCE.nomsCouleurs[teinte]}</option>
        ))}
      </select>
      <span className={cn("col-start-2 flex h-9 w-16 items-center justify-center rounded border text-sm font-bold sm:col-start-auto", classesApercu(genre, code, couleur))} aria-hidden="true">
        {code.code}
      </span>
    </li>
  );
}

function ListeCodes({ titre, vide, genre, codes, couleurs, onChange }: {
  titre: string;
  vide: string;
  genre: ChoixCouleur["genre"];
  codes: readonly CodeAColorer[];
  couleurs: Record<string, string>;
  onChange: (cle: string, valeur: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-marine">{titre}</h3>
      {codes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-bordure-champ px-4 py-3 text-sm text-texte-secondaire">{vide}</p>
      ) : (
        <>
          <p className={cn(GRILLE, "hidden text-sm font-semibold text-texte-secondaire sm:grid")} aria-hidden="true">
            <span>{textes.colonneCode}</span>
            <span>{textes.colonneLibelle}</span>
            <span>{textes.colonneCouleur}</span>
            <span>{textes.colonneApercu}</span>
          </p>
          <ul className="rounded-xl border border-bordure bg-surface px-4">
            {codes.map((code) => {
              const cle = cleChoixCouleur(genre, code.id);
              return <LigneCode key={code.id} genre={genre} code={code} couleur={couleurs[cle] ?? ""} onChange={(valeur) => onChange(cle, valeur)} />;
            })}
          </ul>
        </>
      )}
    </section>
  );
}

const couleursDepart = ({ evenements, profils }: CodesAColorer): Record<string, string> =>
  Object.fromEntries([
    ...evenements.map((code) => [cleChoixCouleur("evenement", code.id), code.couleur ?? ""]),
    ...profils.map((code) => [cleChoixCouleur("profil", code.id), code.couleur ?? ""]),
  ]);

/** Couleur de chaque événement et profil horaire dans le planning (palette fixe, aperçu en direct). */
export function CouleursPlanning({ codes }: { codes: CodesAColorer }) {
  const [etat, action, enCours] = useActionState(modifierCouleursPlanning, ETAT_INITIAL);
  const [couleurs, setCouleurs] = useState(() => couleursDepart(codes));
  const changer = (cle: string, valeur: string) => setCouleurs((actuelles) => ({ ...actuelles, [cle]: valeur }));
  const aDesCodes = codes.evenements.length + codes.profils.length > 0;

  return (
    <form action={action} className="flex flex-col gap-4 border-t border-bordure pt-8" aria-labelledby="titre-couleurs-planning">
      <h2 id="titre-couleurs-planning" className="text-lg font-semibold text-marine">{textes.titre}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListeCodes titre={textes.evenements} vide={textes.aucunEvenement} genre="evenement" codes={codes.evenements} couleurs={couleurs} onChange={changer} />
        <ListeCodes titre={textes.profils} vide={textes.aucunProfil} genre="profil" codes={codes.profils} couleurs={couleurs} onChange={changer} />
      </div>
      <div role="alert" aria-live="polite" className="flex flex-col gap-2">
        <MessageErreur message={etat.message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
        <MessageSucces message={etat.succes?.message} />
      </div>
      {aDesCodes && (
        <Bouton type="submit" variante="contour" disabled={enCours} className="w-full sm:w-fit">
          {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {enCours ? TEXTES_APPARENCE.enregistrementEnCours : textes.enregistrer}
        </Bouton>
      )}
    </form>
  );
}
