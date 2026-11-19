"use client";

import { useState } from "react";
import { CalendarDays, Clock, Sun, Users } from "lucide-react";
import { creerAbsences } from "@/app/(connecte)/exceptions/absences/actions";
import { ChoixEmployes, type EmployeChoisissable } from "@/components/employes/choix-employes";
import { useFormulaireListe, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { SectionFormulaire } from "@/components/programme/section-formulaire";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { FUSEAU_HORAIRE, LONGUEUR_MAX_REMARQUE_ABSENCE } from "@/lib/constantes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { jourDansFuseau } from "@/lib/metier/dates";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";
import { lireTexte } from "@/lib/validation/commun";
import type { EtatFormulaire, EvenementSaisissable } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;
type Duree = "journees" | "heures";

const OPTIONS_DUREE: OptionCarte<Duree>[] = [
  { valeur: "journees", libelle: textes.journees, Icone: Sun },
  { valeur: "heures", libelle: textes.enHeures, Icone: Clock },
];

/**
 * Événement, durée et dates. Recréé à chaque réponse du serveur (clé du formulaire) : son état
 * repart alors de la dernière saisie, comme les autres champs.
 */
function EvenementEtPeriode({ etat, evenements, aujourdhui }: { etat: EtatFormulaireListe; evenements: EvenementSaisissable[]; aujourdhui: string }) {
  const erreurs = etat.erreursChamps;
  const [evenementId, setEvenementId] = useState(() => valeurSaisie(etat, "evenementId", ""));
  const [duree, setDuree] = useState<Duree>(() => (valeurSaisie(etat, "duree", "journees") === "heures" ? "heures" : "journees"));
  const accepteHeures = evenements.find((evenement) => evenement.id === evenementId)?.estSaisiEnHeures ?? false;
  const dureeEffective: Duree = accepteHeures ? duree : "journees";
  const options = evenements.map((evenement) => ({ valeur: evenement.id, libelle: `${evenement.code} · ${evenement.nom}` }));

  return (
    <SectionFormulaire titre={textes.sectionEvenement} icone={CalendarDays}>
      <ChampSelection
        nom="evenementId"
        libelle={textes.evenement}
        options={options}
        optionVide={textes.choisirEvenement}
        // Non contrôlé : React vide le formulaire après l'envoi ; la valeur par défaut, elle, est gardée.
        defaultValue={evenementId}
        onChange={(evenement) => setEvenementId(evenement.target.value)}
        aide={textes.aideEvenement}
        erreur={erreurs?.evenementId}
        required
      />
      {accepteHeures ? (
        <ChoixCartes nom="duree" legende={textes.duree} options={OPTIONS_DUREE} valeur={dureeEffective} onChanger={setDuree} />
      ) : (
        <input type="hidden" name="duree" value="journees" />
      )}

      {dureeEffective === "journees" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="du" libelle={textes.du} type="date" required defaultValue={valeurSaisie(etat, "du", aujourdhui)} erreur={erreurs?.du} className="tabular-nums" />
          <ChampFormulaire nom="au" libelle={textes.au} type="date" required defaultValue={valeurSaisie(etat, "au", aujourdhui)} erreur={erreurs?.au} className="tabular-nums" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <ChampFormulaire nom="jour" libelle={textes.jour} type="date" required defaultValue={valeurSaisie(etat, "jour", aujourdhui)} erreur={erreurs?.jour} className="tabular-nums" />
          <ChampFormulaire nom="de" libelle={textes.de} type="time" required defaultValue={valeurSaisie(etat, "de", "")} aide={textes.aideHeures} erreur={erreurs?.de} className="tabular-nums" />
          <ChampFormulaire nom="a" libelle={textes.a} type="time" required defaultValue={valeurSaisie(etat, "a", "")} erreur={erreurs?.a} className="tabular-nums" />
        </div>
      )}
      <ChampFormulaire nom="remarque" libelle={textes.remarque} defaultValue={valeurSaisie(etat, "remarque", "")} placeholder={textes.exempleRemarque} maxLength={LONGUEUR_MAX_REMARQUE_ABSENCE} autoComplete="off" erreur={erreurs?.remarque} />
    </SectionFormulaire>
  );
}

/**
 * Saisie d'une absence ou d'un événement pour un ou plusieurs employés : événement, puis
 * journées entières (du, au) ou quelques heures sur un jour si l'événement le permet.
 */
export function FormulaireAbsence({
  employes,
  departements,
  evenements,
  onTermine,
  onAnnuler,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  evenements: EvenementSaisissable[];
  onTermine: (succes: Succes) => void;
  onAnnuler: () => void;
}) {
  const [etat, action, enCours] = useFormulaireListe(creerAbsences, onTermine);
  const [aujourdhui] = useState(() => jourDansFuseau(new Date(), FUSEAU_HORAIRE));
  const employesCoches = etat.saisie ? etat.saisie.getAll("employes").map(lireTexte) : [];

  if (evenements.length === 0) {
    return <p className="m-5 rounded-lg border border-bordure bg-fond p-4 text-base text-texte-secondaire">{textes.aucunEvenement}</p>;
  }

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
        <SectionFormulaire titre={textes.sectionEmployes} icone={Users}>
          <ChoixEmployes employes={employes} departements={departements} nomChamp="employes" selectionInitiale={employesCoches} textes={textes} />
          <MessageErreur message={etat.erreursChamps?.employeIds} />
        </SectionFormulaire>
        <EvenementEtPeriode etat={etat} evenements={evenements} aujourdhui={aujourdhui} />
      </div>
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={textes.enregistrer}
        libelleEnCours={textes.enregistrementEnCours}
        libelleAnnuler={textes.annuler}
        onAnnuler={onAnnuler}
      />
    </form>
  );
}
