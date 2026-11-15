"use client";

import { useRef, useState } from "react";
import { Clock, LoaderCircle, Users } from "lucide-react";
import { creerPointagesManuels } from "@/app/(connecte)/exceptions/pointages-manuels/actions";
import { ChoixEmployes, type EmployeChoisissable } from "@/components/employes/choix-employes";
import { useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { SectionFormulaire } from "@/components/programme/section-formulaire";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { ETATS_POINTAGE, FUSEAU_HORAIRE, LONGUEUR_MAX_REMARQUE_POINTAGE } from "@/lib/constantes";
import { formaterHeure } from "@/lib/formats";
import { jourDansFuseau } from "@/lib/metier/dates";
import type { ElementArbre } from "@/lib/metier/arbre";
import { lireTexte } from "@/lib/validation/commun";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { EtatFormulaire } from "@/types";

const textes = TEXTES_EXCEPTIONS.pointages;
const OPTIONS_ETAT = ETATS_POINTAGE.map((etat) => ({ valeur: etat, libelle: `${textes.etats[etat]} (${textes.etatsBadgeuse[etat]})` }));

type Succes = NonNullable<EtatFormulaire["succes"]>;

/**
 * Saisie d'un pointage manuel pour un ou plusieurs employés : choix des employés, date et heure
 * locales (préremplies avec maintenant), état et remarque. « Enregistrer et nouveau » garde la
 * fenêtre ouverte pour enchaîner (par exemple une entrée puis une pause).
 */
export function FormulairePointage({
  employes,
  departements,
  onTermine,
  onAnnuler,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
}) {
  // Bouton utilisé, lu dans l'envoi lui-même (« apres ») : fiable quel que soit l'ordre des rendus.
  const apresNouveau = useRef(false);
  const [continuer, setContinuer] = useState(false);
  const [dernierSucces, setDernierSucces] = useState<string>();
  const enregistrer = (precedent: EtatFormulaire, formulaire: FormData) => {
    apresNouveau.current = formulaire.get("apres") === "nouveau";
    return creerPointagesManuels(precedent, formulaire);
  };
  const [etat, action, enCours] = useFormulaireListe(enregistrer, (succes) => {
    if (apresNouveau.current) setDernierSucces(succes.message);
    else onTermine(succes);
  });
  const erreurs = etat.erreursChamps;
  // Maintenant, à l'heure de l'entreprise (la fenêtre ne s'affiche que dans le navigateur).
  const [maintenant] = useState(() => new Date());
  // Après « Enregistrer et nouveau », les mêmes employés restent cochés : on enchaîne entrée, pause, sortie.
  const employesCoches = etat.saisie ? etat.saisie.getAll("employes").map(lireTexte) : [];

  return (
    <form action={action} onSubmit={() => setDernierSucces(undefined)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
        {dernierSucces && <MessageSucces message={dernierSucces} />}
        <SectionFormulaire titre={textes.sectionEmployes} icone={Users}>
          <ChoixEmployes employes={employes} departements={departements} nomChamp="employes" selectionInitiale={employesCoches} textes={textes} />
          <MessageErreur message={erreurs?.employeIds} />
        </SectionFormulaire>
        <SectionFormulaire titre={textes.sectionPointage} icone={Clock}>
          <div className="grid gap-4 sm:grid-cols-3">
            <ChampFormulaire nom="jour" libelle={textes.jour} type="date" required defaultValue={valeurSaisie(etat, "jour", jourDansFuseau(maintenant, FUSEAU_HORAIRE))} erreur={erreurs?.jour} className="tabular-nums" />
            <ChampFormulaire nom="heure" libelle={textes.heure} type="time" required defaultValue={valeurSaisie(etat, "heure", formaterHeure(maintenant))} aide={textes.aideHeure} erreur={erreurs?.heure} className="tabular-nums" />
            <ChampSelection nom="etat" libelle={textes.etat} options={OPTIONS_ETAT} defaultValue={valeurSaisie(etat, "etat", ETATS_POINTAGE[0])} required erreur={erreurs?.etat} />
          </div>
          <ChampFormulaire nom="remarque" libelle={textes.remarque} defaultValue={valeurSaisie(etat, "remarque", "")} placeholder={textes.exempleRemarque} maxLength={LONGUEUR_MAX_REMARQUE_POINTAGE} autoComplete="off" erreur={erreurs?.remarque} />
        </SectionFormulaire>
      </div>

      <div className="shrink-0 border-t border-bordure bg-fond px-5 py-3 sm:px-6">
        <div role="alert" aria-live="polite">
          <MessageErreur message={etat.message} className="mb-3 rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
        </div>
        {/* Le bouton principal vient en premier dans le code : c'est lui que déclenche la touche Entrée. */}
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <Bouton type="submit" name="apres" value="fermer" disabled={enCours} onClick={() => setContinuer(false)}>
            {enCours && !continuer && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {enCours && !continuer ? textes.enregistrementEnCours : textes.enregistrer}
          </Bouton>
          <Bouton type="submit" name="apres" value="nouveau" variante="contour" disabled={enCours} onClick={() => setContinuer(true)}>
            {enCours && continuer && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {textes.enregistrerEtNouveau}
          </Bouton>
          <Bouton variante="fantome" onClick={onAnnuler}>{textes.annuler}</Bouton>
        </div>
      </div>
    </form>
  );
}
