"use client";

import { useState } from "react";
import { CalendarRange, Calculator, Check, CircleMinus, CirclePlus, Paperclip, X } from "lucide-react";
import { caseSaisie, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { SectionFormulaire } from "@/components/programme/section-formulaire";
import { ChampDate } from "@/components/ui/champ-date";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { MessageErreur } from "@/components/ui/message-erreur";
import { LONGUEUR_MAX_REMARQUE_DROIT } from "@/lib/constantes";
import type { UniteDroit } from "@/lib/metier/droits-conges";
import { formaterValeurDroit, TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { cn } from "@/lib/utils";
import type { DroitCongeListe } from "@/types";
import { ChampPiecesJointes } from "./champ-pieces-jointes";
import { ValeursChiffrees } from "./valeurs-droit";

/** Valeurs de départ d'un droit (création : année en cours ; modification : le droit existant). */
export type ValeursDroit = {
  du: string;
  au: string;
  uniteSaisie: UniteDroit;
  joursAcquis: string;
  joursReliquat: string;
  supplement1: string;
  supplement2: string;
  supplement3: string;
  estConfirme: boolean;
  estBloquant: boolean;
  estReporte: boolean;
  remarque: string;
};

type OuiNon = "oui" | "non";
type Solde = "positif" | "negatif";
const OPTIONS_OUI_NON: OptionCarte<OuiNon>[] = [
  { valeur: "oui", libelle: textes.ouiChoix, Icone: Check },
  { valeur: "non", libelle: textes.nonChoix, Icone: X },
];
const OPTIONS_SOLDE: OptionCarte<Solde>[] = [
  { valeur: "negatif", libelle: textes.soldes.negatif, Icone: CircleMinus },
  { valeur: "positif", libelle: textes.soldes.positif, Icone: CirclePlus },
];
const enOuiNon = (vrai: boolean): OuiNon => (vrai ? "oui" : "non");

/** Raccourci de période : toute une année civile. */
function BoutonAnnee({ annee, onChoisir }: { annee: number; onChoisir: (du: string, au: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChoisir(`${annee}-01-01`, `${annee}-12-31`)}
      className="min-h-11 rounded-lg border border-bordure bg-surface px-3 text-sm font-medium text-marine transition-colors duration-150 hover:border-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-9"
    >
      {textes.anneeEnCours(annee)}
    </button>
  );
}

/** Jours acquis, prévus, consommés et solde du droit existant (fenêtre de modification). */
function BilanDroit({ bilan, unite }: { bilan: DroitCongeListe["bilan"]; unite: UniteDroit }) {
  const cases = [
    { libelle: textes.acquis, valeur: bilan.total },
    { libelle: textes.prevus, valeur: bilan.prevus },
    { libelle: textes.pris, valeur: bilan.pris },
    { libelle: textes.reste, valeur: bilan.soldePrevisionnel },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={textes.bilan}>
      {cases.map(({ libelle, valeur }, rang) => (
        <div key={libelle} className={cn("flex flex-col gap-0.5 rounded-lg border px-3 py-2", rang === 3 ? "border-primaire/30 bg-ciel" : "border-bordure bg-fond")}>
          <dt className="text-sm text-texte-secondaire">{libelle}</dt>
          <dd className={cn("text-lg font-bold tabular-nums", rang === 3 && valeur < 0 ? "text-erreur" : "text-marine")}>{formaterValeurDroit(valeur, unite)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Un choix de la fiche (deux cartes) avec son explication. */
function Choix<V extends string>({ nom, legende, aide, options, initiale }: { nom: string; legende: string; aide: string; options: OptionCarte<V>[]; initiale: V }) {
  const [valeur, setValeur] = useState<V>(initiale);
  return (
    <div className="flex flex-col gap-1">
      <ChoixCartes nom={nom} legende={legende} options={options} valeur={valeur} onChanger={setValeur} />
      <p className="text-sm text-texte-secondaire">{aide}</p>
    </div>
  );
}

/** Confirmation, solde et report : les choix Oui / Non de la fiche. */
function Reglages({ etat, initiales }: { etat: EtatFormulaireListe; initiales: ValeursDroit }) {
  const lire = <V extends string>(nom: string, parDefaut: V, valeurs: readonly V[]): V => {
    const saisie = valeurSaisie(etat, nom, parDefaut);
    return (valeurs as readonly string[]).includes(saisie) ? (saisie as V) : parDefaut;
  };
  return (
    <>
      <Choix nom="estConfirme" legende={textes.confirmation} aide={textes.aideConfirmation} options={OPTIONS_OUI_NON} initiale={lire("estConfirme", enOuiNon(initiales.estConfirme), ["oui", "non"])} />
      <Choix nom="solde" legende={textes.solde} aide={textes.aideSolde} options={OPTIONS_SOLDE} initiale={lire<Solde>("solde", initiales.estBloquant ? "positif" : "negatif", ["positif", "negatif"])} />
      <Choix nom="estReporte" legende={textes.reportSurPeriode} aide={textes.aideReport} options={OPTIONS_OUI_NON} initiale={lire("estReporte", enOuiNon(initiales.estReporte), ["oui", "non"])} />
    </>
  );
}

/**
 * Corps de la fiche d'un droit, commun à la création et à la modification : période, droit et
 * son unité, confirmation, solde, report, reliquat et suppléments avec le total, pièces jointes et
 * remarque. Recréé à chaque réponse du serveur (clé du formulaire) avec la dernière saisie.
 */
export function ChampsDroit({ etat, initiales, anneeCourante, bilan }: { etat: EtatFormulaireListe; initiales: ValeursDroit; anneeCourante: number; bilan?: DroitCongeListe["bilan"] }) {
  const erreurs = etat.erreursChamps;
  const [du, setDu] = useState(() => valeurSaisie(etat, "du", initiales.du));
  const [au, setAu] = useState(() => valeurSaisie(etat, "au", initiales.au));
  const choisirAnnee = (debut: string, fin: string) => {
    setDu(debut);
    setAu(fin);
  };

  return (
    <>
      <SectionFormulaire titre={textes.sectionDroit} icone={CalendarRange}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={textes.raccourcisPeriode}>
          <span className="text-sm text-texte-secondaire">{textes.raccourcisPeriode} :</span>
          <BoutonAnnee annee={anneeCourante} onChoisir={choisirAnnee} />
          <BoutonAnnee annee={anneeCourante + 1} onChoisir={choisirAnnee} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampDate nom="du" libelle={textes.du} required value={du} onChange={setDu} erreur={erreurs?.du} />
          <ChampDate nom="au" libelle={textes.au} required value={au} onChange={setAu} erreur={erreurs?.au} />
        </div>
      </SectionFormulaire>

      <SectionFormulaire titre={textes.sectionJours} icone={Calculator}>
        {bilan && <BilanDroit bilan={bilan} unite={initiales.uniteSaisie} />}
        <ValeursChiffrees etat={etat} initiales={initiales} reglages={<Reglages etat={etat} initiales={initiales} />} />
        <MessageErreur message={erreurs?.uniteSaisie ?? erreurs?.estConfirme ?? erreurs?.estBloquant ?? erreurs?.estReporte} />
      </SectionFormulaire>

      <SectionFormulaire titre={textes.sectionJustificatif} icone={Paperclip}>
        <ChampPiecesJointes cocheeInitialement={caseSaisie(etat, "aPieceJointe", false)} erreur={erreurs?.fichiers} />
        <ChampFormulaire nom="remarque" libelle={textes.remarque} defaultValue={valeurSaisie(etat, "remarque", initiales.remarque)} placeholder={textes.exempleRemarque} maxLength={LONGUEUR_MAX_REMARQUE_DROIT} autoComplete="off" erreur={erreurs?.remarque} />
      </SectionFormulaire>
    </>
  );
}
