"use client";

import { useState } from "react";
import { CalendarCheck, Users } from "lucide-react";
import { creerDroits, modifierDroit } from "@/app/(connecte)/presence/droits-conges/actions";
import { ChoixCibleEmployes, type GroupeChoisissable } from "@/components/employes/choix-cible-employes";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { LienSupprimerSaisie } from "@/components/liste/gestion-saisie";
import { useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { SectionFormulaire } from "@/components/programme/section-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import type { ElementArbre } from "@/lib/metier/arbre";
import { jourDansFuseau } from "@/lib/metier/dates";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { lireTexte } from "@/lib/validation/commun";
import type { DroitCongeListe, EtatFormulaire, EvenementDroit } from "@/types";
import { ChampsDroit, type ValeursDroit } from "./champs-droit";

type Succes = NonNullable<EtatFormulaire["succes"]>;
type ProprietesFenetre = { onTermine: (succes: Succes) => void; onAnnuler: () => void };

const anneeLocale = () => Number(jourDansFuseau(new Date(), FUSEAU_HORAIRE).slice(0, 4));
const enTexte = (jours: number) => String(jours).replace(".", ",");

/** Code droit (liste des codes) et son libellé, côte à côte comme sur la fiche. */
function CodeDroit({ evenements, initial, erreur }: { evenements: EvenementDroit[]; initial: string; erreur?: string }) {
  const [id, setId] = useState(initial);
  const choisi = evenements.find((evenement) => evenement.id === id);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ChampSelection
        nom="evenementId"
        libelle={textes.evenement}
        options={evenements.map((evenement) => ({ valeur: evenement.id, libelle: `${evenement.code} · ${evenement.nom}` }))}
        optionVide={textes.choisirEvenement}
        value={id}
        onChange={(evenement) => setId(evenement.target.value)}
        erreur={erreur}
        required
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-texte">{textes.libelleDroit}</span>
        <p className="flex h-11 items-center rounded-lg border border-bordure bg-fond px-3.5 text-base text-texte lg:h-10" aria-live="polite">{choisi?.nom ?? "-"}</p>
      </div>
    </div>
  );
}

function Pied({ message, enCours, onAnnuler }: { message?: string; enCours: boolean; onAnnuler: () => void }) {
  return <PiedFormulaire message={message} enCours={enCours} libelle={textes.enregistrer} libelleEnCours={textes.enregistrementEnCours} libelleAnnuler={textes.annuler} onAnnuler={onAnnuler} />;
}

/** Attribution d'un même droit (événement, période, jours) à un ou plusieurs employés. */
export function FormulaireCreationDroits({
  employes,
  groupes,
  departements,
  evenements,
  onTermine,
  onAnnuler,
}: ProprietesFenetre & { employes: EmployeChoisissable[]; groupes: GroupeChoisissable[]; departements: ElementArbre[]; evenements: EvenementDroit[] }) {
  const [etat, action, enCours] = useFormulaireListe(creerDroits, onTermine);
  const [annee] = useState(anneeLocale);
  const employesCoches = etat.saisie ? etat.saisie.getAll("employes").map(lireTexte) : [];
  const initiales: ValeursDroit = {
    du: `${annee}-01-01`,
    au: `${annee}-12-31`,
    uniteSaisie: "journee",
    joursAcquis: "",
    joursReliquat: "0",
    supplement1: "0",
    supplement2: "0",
    supplement3: "0",
    estConfirme: true,
    estBloquant: true,
    estReporte: false,
    remarque: "",
  };

  if (evenements.length === 0) {
    return <p className="m-5 rounded-lg border border-bordure bg-fond p-4 text-base text-texte-secondaire">{textes.aucunEvenement}</p>;
  }

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
        <SectionFormulaire titre={textes.sectionEmployes} icone={Users}>
          <ChoixCibleEmployes employes={employes} groupes={groupes} departements={departements} nomChamp="employes" selectionInitiale={employesCoches} textes={textes} />
          <MessageErreur message={etat.erreursChamps?.employeIds} />
        </SectionFormulaire>
        <SectionFormulaire titre={textes.evenement} icone={CalendarCheck}>
          <CodeDroit evenements={evenements} initial={valeurSaisie(etat, "evenementId", "")} erreur={etat.erreursChamps?.evenementId} />
        </SectionFormulaire>
        <ChampsDroit etat={etat} initiales={initiales} anneeCourante={annee} />
      </div>
      <Pied message={etat.message} enCours={enCours} onAnnuler={onAnnuler} />
    </form>
  );
}

/** Modification d'un droit : l'employé et l'événement restent ceux d'origine ; la suppression se fait d'ici. */
export function FormulaireModificationDroit({ droit, onTermine, onAnnuler }: ProprietesFenetre & { droit: DroitCongeListe }) {
  const [etat, action, enCours] = useFormulaireListe(modifierDroit, onTermine);
  const [annee] = useState(anneeLocale);
  const initiales: ValeursDroit = {
    du: droit.debut,
    au: droit.fin,
    joursAcquis: enTexte(droit.joursAcquis),
    joursReliquat: enTexte(droit.joursReliquat),
    uniteSaisie: droit.uniteSaisie,
    supplement1: enTexte(droit.supplement1),
    supplement2: enTexte(droit.supplement2),
    supplement3: enTexte(droit.supplement3),
    estConfirme: droit.estConfirme,
    estBloquant: droit.estBloquant,
    estReporte: droit.estReporte,
    remarque: droit.remarque ?? "",
  };

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="id" value={droit.id} />
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5 sm:px-6">
        <p className="flex items-center gap-3 rounded-lg bg-ciel px-4 py-3 text-base font-semibold text-marine">
          <CalendarCheck className="size-5 shrink-0" aria-hidden="true" />
          {textes.employeFixe(`${droit.prenom} ${droit.nom}`, `${droit.evenementCode} · ${droit.evenementNom}`)}
        </p>
        <ChampsDroit etat={etat} initiales={initiales} anneeCourante={annee} bilan={droit.bilan} />
        <LienSupprimerSaisie id={droit.id} nom={`${droit.prenom} ${droit.nom}`} libelle={textes.supprimerCeDroit} />
      </div>
      <Pied message={etat.message} enCours={enCours} onAnnuler={onAnnuler} />
    </form>
  );
}
