"use client";

import { useActionState, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { modifierEntreprise } from "@/app/(connecte)/administration/entreprise/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import {
  LONGUEUR_ICE,
  LONGUEUR_MAX_ADRESSE_ENTREPRISE,
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_NOM_ENTREPRISE,
  LONGUEUR_MAX_RC,
} from "@/lib/constantes";
import type { FicheEntreprise } from "@/lib/donnees/entreprise";
import { formaterTelephone } from "@/lib/metier/employes";
import { TEXTES_ENTREPRISE as textes } from "@/lib/textes/entreprise";
import type { ChampEntreprise } from "@/lib/validation/entreprise";
import type { EtatFormulaire } from "@/types";
import { CHOIX_LOGO_INITIAL, ChampLogo, type ChoixLogo } from "./champ-logo";

const ETAT_INITIAL: EtatFormulaire = {};

/** Valeurs affichées dans les champs (téléphone lisible), vides sans fiche. */
function valeursInitiales(fiche: FicheEntreprise | null): Record<ChampEntreprise, string> {
  return {
    nom: fiche?.nom ?? "",
    adresse: fiche?.adresse ?? "",
    telephone: fiche?.telephone ? formaterTelephone(fiche.telephone) : "",
    email: fiche?.email ?? "",
    ice: fiche?.ice ?? "",
    registreCommerce: fiche?.registreCommerce ?? "",
    identifiantFiscal: fiche?.identifiantFiscal ?? "",
    numeroCnss: fiche?.numeroCnss ?? "",
  };
}

function Carte({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-6">
      <legend className="float-left mb-1 text-lg font-semibold text-marine">{titre}</legend>
      {children}
    </fieldset>
  );
}

/** Fiche de l'entreprise : logo, identité et coordonnées, identifiants légaux. */
export function FormulaireEntreprise({ actuelle }: { actuelle: FicheEntreprise | null }) {
  const [valeurs, setValeurs] = useState(() => valeursInitiales(actuelle));
  const [logo, setLogo] = useState<ChoixLogo>(CHOIX_LOGO_INITIAL);

  // Le logo choisi vit dans l'état (jamais effacé par la remise à zéro du formulaire) et part avec l'envoi.
  const [etat, action, enCours] = useActionState(async (precedent: EtatFormulaire, formulaire: FormData) => {
    if (logo.fichier) formulaire.set("logo", logo.fichier);
    if (logo.estRetire) formulaire.set("retirerLogo", "oui");
    const resultat = await modifierEntreprise(precedent, formulaire);
    if (resultat.succes) setLogo(CHOIX_LOGO_INITIAL);
    return resultat;
  }, ETAT_INITIAL);
  const erreurs = etat.erreursChamps;

  const champ = (nom: ChampEntreprise, proprietes: { type?: string; maxLength?: number; autoComplete?: string; inputMode?: "numeric" | "tel" | "email"; placeholder?: string; required?: boolean } = {}) => (
    <ChampFormulaire
      nom={nom}
      libelle={textes.champs[nom]}
      erreur={erreurs?.[nom]}
      value={valeurs[nom]}
      onChange={(evenement) => setValeurs((actuel) => ({ ...actuel, [nom]: evenement.target.value }))}
      {...proprietes}
    />
  );

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Carte titre={textes.sections.logo}>
        <ChampLogo logoVersion={actuelle?.logoVersion ?? null} choix={logo} onChange={setLogo} erreur={erreurs?.logo} />
      </Carte>

      <Carte titre={textes.sections.identite}>
        {champ("nom", { maxLength: LONGUEUR_MAX_NOM_ENTREPRISE, autoComplete: "organization", placeholder: textes.exemples.nom, required: true })}
        {champ("adresse", { maxLength: LONGUEUR_MAX_ADRESSE_ENTREPRISE, autoComplete: "street-address" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {champ("telephone", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: textes.exemples.telephone })}
          {champ("email", { type: "email", inputMode: "email", maxLength: LONGUEUR_MAX_EMAIL, autoComplete: "email", placeholder: textes.exemples.email })}
        </div>
      </Carte>

      <Carte titre={textes.sections.legal}>
        <div className="grid gap-4 sm:grid-cols-2">
          {champ("ice", { inputMode: "numeric", maxLength: LONGUEUR_ICE + 4, placeholder: textes.exemples.ice })}
          {champ("registreCommerce", { maxLength: LONGUEUR_MAX_RC, placeholder: textes.exemples.registreCommerce })}
          {champ("identifiantFiscal", { inputMode: "numeric" })}
          {champ("numeroCnss", { inputMode: "numeric" })}
        </div>
      </Carte>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div role="alert" aria-live="polite" className="flex flex-col gap-2 sm:me-auto">
          <MessageErreur message={etat.message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
          <MessageSucces message={etat.succes?.message} />
        </div>
        <Bouton type="submit" disabled={enCours}>
          {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {enCours ? textes.enregistrementEnCours : textes.enregistrer}
        </Bouton>
      </div>
    </form>
  );
}
