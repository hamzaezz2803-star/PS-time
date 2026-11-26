"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { enregistrerRegle } from "@/app/(connecte)/programme/horaire-dynamique/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { COULEUR_REGLE_DEFAUT, COULEURS_REGLE, type CouleurRegle } from "@/lib/constantes";
import { JOURS_ISO, normaliserJours, regleEnConflit } from "@/lib/metier/horaire-dynamique";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";
import { heureDePlage } from "@/lib/validation/profil-horaire";
import { cn } from "@/lib/utils";
import type { RegleHoraireListe } from "@/types";
import { ChoixCouleurRegle } from "./couleur-regle";

const JOURS_OUVRES = [1, 2, 3, 4, 5];

/** Création (sans `element`) ou modification d'une règle : fenêtre, profil, jours, active. */
export function FormulaireRegle({
  element,
  regles,
  profils,
  onTermine,
  onAnnuler,
}: ProprietesFormulaireListe<RegleHoraireListe> & { regles: RegleHoraireListe[]; profils: OptionSelection[] }) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerRegle, onTermine);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <ContenuRegle key={etat.numeroReponse} etat={etat} regle={element} regles={regles} profils={profils} />
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

function joursInitiaux(etat: EtatFormulaireListe, regle?: RegleHoraireListe): number[] {
  if (etat.saisie) return etat.saisie.getAll("jours").map(Number);
  return regle?.jours ?? JOURS_OUVRES;
}

function ContenuRegle({
  etat,
  regle,
  regles,
  profils,
}: {
  etat: EtatFormulaireListe;
  regle?: RegleHoraireListe;
  regles: RegleHoraireListe[];
  profils: OptionSelection[];
}) {
  const [debut, setDebut] = useState(valeurSaisie(etat, "debut", regle ? minutesVersHeure(regle.debut) : ""));
  const [fin, setFin] = useState(valeurSaisie(etat, "fin", regle ? minutesVersHeure(regle.fin) : ""));
  const [jours, setJours] = useState(() => joursInitiaux(etat, regle));
  const [estActif, setEstActif] = useState(caseSaisie(etat, "estActif", regle?.estActif ?? true));
  const [profilId, setProfilId] = useState(valeurSaisie(etat, "profilId", regle?.profilId ?? ""));
  const [couleur, setCouleur] = useState<CouleurRegle>(() => {
    const saisie = valeurSaisie(etat, "couleur", regle?.couleur ?? COULEUR_REGLE_DEFAUT);
    return COULEURS_REGLE.find((element) => element === saisie) ?? COULEUR_REGLE_DEFAUT;
  });
  const erreurs = etat.erreursChamps;
  // Libellé d'option « CODE · Nom » : sert seulement à l'aperçu de la pastille.
  const [codeApercu, ...nomApercu] = (profils.find((profil) => profil.valeur === profilId)?.libelle ?? textes.profil).split(" · ");

  // Confort seulement : la vérification qui compte est refaite par le serveur.
  const minutesDebut = heureDePlage(debut);
  const minutesFin = heureDePlage(fin);
  const conflit =
    minutesDebut !== null && minutesFin !== null && minutesFin > minutesDebut
      ? regleEnConflit({ id: regle?.id ?? "", debut: minutesDebut, fin: minutesFin, jours: normaliserJours(jours), profilId: "", estActif }, regles)
      : null;

  const basculerJour = (jour: number) => setJours((actuels) => (actuels.includes(jour) ? actuels.filter((j) => j !== jour) : [...actuels, jour]));

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="debut" libelle={textes.heureDebut} type="time" value={debut} onChange={(e) => setDebut(e.target.value)} required erreur={erreurs?.debut} />
          <ChampFormulaire nom="fin" libelle={textes.heureFin} type="time" value={fin} onChange={(e) => setFin(e.target.value)} required erreur={erreurs?.fin} />
        </div>
        <p className="text-sm text-texte-secondaire">{textes.aideFenetre}</p>
      </div>

      <ChampSelection nom="profilId" libelle={textes.profil} options={profils} optionVide={textes.choisirProfil} value={profilId} onChange={(e) => setProfilId(e.target.value)} erreur={erreurs?.profilId} />

      <ChoixCouleurRegle valeur={couleur} onChange={setCouleur} apercu={{ code: nomApercu.length > 0 ? codeApercu : "", nom: nomApercu.length > 0 ? nomApercu.join(" · ") : codeApercu }} />
      <MessageErreur message={erreurs?.couleur} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-texte">{textes.jours}</legend>
        <div className="flex flex-wrap items-center gap-2">
          {JOURS_ISO.map((jour) => {
            const estCoche = jours.includes(jour);
            return (
              <label
                key={jour}
                title={textes.joursLongs[jour - 1]}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-lg border text-base font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primaire lg:size-10",
                  estCoche ? "border-primaire bg-primaire text-white" : "border-bordure-champ bg-surface text-texte-secondaire hover:bg-fond",
                )}
              >
                <input type="checkbox" name="jours" value={jour} checked={estCoche} onChange={() => basculerJour(jour)} className="sr-only" aria-label={textes.joursLongs[jour - 1]} />
                <span aria-hidden="true">{textes.joursCourts[jour - 1]}</span>
              </label>
            );
          })}
          <span className="mx-1 h-6 w-px bg-bordure" aria-hidden="true" />
          <button type="button" onClick={() => setJours(JOURS_OUVRES)} className="min-h-11 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
            {textes.joursOuvres}
          </button>
          <button type="button" onClick={() => setJours([...JOURS_ISO])} className="min-h-11 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
            {textes.tousLesJours}
          </button>
        </div>
        <p className="text-sm text-texte-secondaire">{textes.aideJours}</p>
      </fieldset>

      <CaseACocher nom="estActif" libelle={textes.estActif} aide={textes.aideActif} checked={estActif} onChange={(e) => setEstActif(e.target.checked)} />

      {conflit && (
        <p role="status" className="flex items-start gap-2.5 rounded-lg border border-attention/40 bg-attention/5 p-3 text-sm text-texte">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden="true" />
          {textes.conflitClient(conflit.nom)}
        </p>
      )}
      <MessageErreur message={erreurs?.jours} />
    </div>
  );
}
