"use client";

import { useState } from "react";
import { BedDouble, Briefcase } from "lucide-react";
import { enregistrerProfil } from "@/app/(connecte)/programme/profils-horaires/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_CODE_PROFIL, LONGUEUR_MAX_NOM_PROGRAMME, REPAS_MAX_MINUTES } from "@/lib/constantes";
import { PLAGES_JOURNEE_TYPE, TYPES_PLAGE, type TypePlage } from "@/lib/metier/profil-horaire";
import { TEXTES_PROFILS } from "@/lib/textes/profils-horaires";
import { lireTexte } from "@/lib/validation/commun";
import type { ProfilHoraire } from "@/types";
import { cn } from "@/lib/utils";
import { EditeurPlages, versLignes, type LignePlage } from "./editeur-plages";

const { champs, types } = TEXTES_PROFILS;

/** Lignes de plages : la dernière saisie après une erreur, sinon le profil, sinon le modèle de 8 h. */
function lignesInitiales(saisie: FormData | undefined, profil: ProfilHoraire | undefined): LignePlage[] {
  if (saisie) {
    const types = saisie.getAll("plageType").map(lireTexte);
    return saisie.getAll("plageFin").map((fin, rang) => ({
      fin: lireTexte(fin),
      type: TYPES_PLAGE.find((type) => type === types[rang]) ?? ("interdite" as TypePlage),
    }));
  }
  return versLignes(profil && profil.plages.length > 0 ? profil.plages : PLAGES_JOURNEE_TYPE);
}

/** Choix Travail / Repos en deux grandes cartes (zone cliquable confortable). */
function ChoixType({ valeur, onChanger }: { valeur: "travail" | "repos"; onChanger: (type: "travail" | "repos") => void }) {
  const options = [
    { type: "travail" as const, Icone: Briefcase },
    { type: "repos" as const, Icone: BedDouble },
  ];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-texte">{champs.type}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ type, Icone }) => (
          <label
            key={type}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-base font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primaire",
              valeur === type ? "border-primaire bg-ciel text-marine" : "border-bordure-champ bg-surface text-texte hover:bg-fond",
            )}
          >
            <input type="radio" name="type" value={type} checked={valeur === type} onChange={() => onChanger(type)} className="sr-only" />
            <Icone className="size-5" aria-hidden="true" />
            {types[type]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Création (sans `element`) ou modification d'un profil horaire. */
export function FormulaireProfil({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<ProfilHoraire>) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerProfil, onTermine);
  const erreurs = etat.erreursChamps;
  const typeInitial = valeurSaisie(etat, "type", element?.type ?? "travail") === "repos" ? "repos" : "travail";
  const [type, setType] = useState<"travail" | "repos">(typeInitial);
  const repas = (nom: "repasMinimumMinutes" | "repasMaximumMinutes") => valeurSaisie(etat, nom, element?.[nom] != null ? String(element[nom]) : "");

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <ChampFormulaire nom="code" libelle={champs.code} defaultValue={valeurSaisie(etat, "code", element?.code ?? "")} maxLength={LONGUEUR_MAX_CODE_PROFIL} autoComplete="off" autoCapitalize="characters" spellCheck={false} required className="uppercase" aide={champs.aideCode} erreur={erreurs?.code} data-focus-initial />
          <ChampFormulaire nom="nom" libelle={champs.nom} defaultValue={valeurSaisie(etat, "nom", element?.nom ?? "")} placeholder={champs.exempleNom} maxLength={LONGUEUR_MAX_NOM_PROGRAMME} autoComplete="off" required erreur={erreurs?.nom} />
        </div>

        <ChoixType valeur={type} onChanger={setType} />
        <MessageErreur message={erreurs?.type} />

        {type === "travail" ? (
          <>
            <CaseACocher nom="estBadge" libelle={champs.estBadge} aide={champs.aideBadge} defaultChecked={caseSaisie(etat, "estBadge", element?.estBadge ?? true)} />
            <EditeurPlages initiales={lignesInitiales(etat.saisie, element)} erreur={erreurs?.plages} />
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 text-base font-semibold text-marine">{champs.repas}</legend>
              <ChampFormulaire nom="repasMinimumMinutes" libelle={champs.repasMinimum} defaultValue={repas("repasMinimumMinutes")} inputMode="numeric" maxLength={3} aide={champs.aideRepas} erreur={erreurs?.repasMinimumMinutes} className="tabular-nums" placeholder={`0 – ${REPAS_MAX_MINUTES}`} />
              <ChampFormulaire nom="repasMaximumMinutes" libelle={champs.repasMaximum} defaultValue={repas("repasMaximumMinutes")} inputMode="numeric" maxLength={3} erreur={erreurs?.repasMaximumMinutes} className="tabular-nums" placeholder={`0 – ${REPAS_MAX_MINUTES}`} />
            </fieldset>
          </>
        ) : (
          <p className="rounded-lg border border-bordure bg-fond p-4 text-base text-texte-secondaire">{TEXTES_PROFILS.journeeRepos}</p>
        )}
      </div>
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={TEXTES_PROFILS.enregistrer}
        libelleEnCours={TEXTES_PROFILS.enregistrementEnCours}
        libelleAnnuler={TEXTES_PROFILS.annuler}
        onAnnuler={onAnnuler}
      />
    </form>
  );
}
