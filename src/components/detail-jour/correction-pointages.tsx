"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { creerPointagesManuels, supprimerPointage } from "@/app/(connecte)/exceptions/pointages-manuels/actions";
import { SuppressionElement } from "@/components/arbre/suppression-element";
import { useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { ETATS_POINTAGE, LONGUEUR_MAX_REMARQUE_POINTAGE } from "@/lib/constantes";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import type { EtatFormulaire } from "@/types";

const t = TEXTES_DETAIL_JOUR.pointages;
const textesPointage = TEXTES_EXCEPTIONS.pointages;
const OPTIONS_ETAT = ETATS_POINTAGE.map((etat) => ({ valeur: etat, libelle: `${textesPointage.etats[etat]} (${textesPointage.etatsBadgeuse[etat]})` }));

type Succes = NonNullable<EtatFormulaire["succes"]>;

/** Saisie d'un pointage manquant pour l'employé et le jour affichés (mêmes règles que Pointage manuel). */
function FormulaireAjout({ employeId, date, onTermine, onAnnuler }: { employeId: string; date: string; onTermine: (succes: Succes) => void; onAnnuler: () => void }) {
  const [etat, action, enCours] = useFormulaireListe(creerPointagesManuels, onTermine);
  const erreurs = etat.erreursChamps;
  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="employes" value={employeId} />
      <input type="hidden" name="jour" value={date} />
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="heure" libelle={textesPointage.heure} type="time" required defaultValue={valeurSaisie(etat, "heure", "")} erreur={erreurs?.heure ?? erreurs?.jour ?? erreurs?.employeIds} className="tabular-nums" data-focus-initial />
          <ChampSelection nom="etat" libelle={textesPointage.etat} options={OPTIONS_ETAT} defaultValue={valeurSaisie(etat, "etat", ETATS_POINTAGE[0])} required erreur={erreurs?.etat} />
        </div>
        <ChampFormulaire nom="remarque" libelle={textesPointage.remarque} defaultValue={valeurSaisie(etat, "remarque", "")} placeholder={textesPointage.exempleRemarque} maxLength={LONGUEUR_MAX_REMARQUE_POINTAGE} autoComplete="off" erreur={erreurs?.remarque} />
      </div>
      <PiedFormulaire message={etat.message} enCours={enCours} libelle={textesPointage.enregistrer} libelleEnCours={textesPointage.enregistrementEnCours} libelleAnnuler={t.annuler} onAnnuler={onAnnuler} />
    </form>
  );
}

/**
 * Bouton « Ajouter un pointage » de la carte Pointages : pour une badgeuse en panne ou un badge
 * oublié. Le serveur revérifie la page Pointage manuel, l'employé et l'heure (jamais dans le futur).
 */
export function AjoutPointageJour({ employeId, date, libelleJour }: { employeId: string; date: string; libelleJour: string }) {
  const [estOuverte, setEstOuverte] = useState(false);
  const [message, setMessage] = useState<string>();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(undefined);
          setEstOuverte(true);
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t.ajouter}
      </button>
      {/* Le pointage apparaît dans la liste (page actualisée par l'action) ; annoncé aux lecteurs d'écran. */}
      <span className="sr-only" role="status">
        {estOuverte ? "" : message}
      </span>
      <FenetreModale ouverte={estOuverte} onFermer={() => setEstOuverte(false)} titre={t.titreAjout} libelleFermer={t.fermer}>
        <p className="px-5 pt-4 text-base font-semibold text-marine sm:px-6">{libelleJour}</p>
        {estOuverte && (
          <FormulaireAjout
            employeId={employeId}
            date={date}
            onAnnuler={() => setEstOuverte(false)}
            onTermine={(succes) => {
              setMessage(succes.message);
              setEstOuverte(false);
            }}
          />
        )}
      </FenetreModale>
    </>
  );
}

/** Suppression d'un pointage saisi à la main (ceux de la badgeuse ne se suppriment pas). */
export function SuppressionPointageJour({ id, heure }: { id: string; heure: string }) {
  const [estOuverte, setEstOuverte] = useState(false);
  const textes = { confirmerSuppression: t.confirmerSuppression, explicationSuppression: t.explicationSuppression, oui: t.oui, annuler: t.annuler };
  return (
    <>
      <BoutonIcone libelle={t.supprimer(heure)} Icone={Trash2} onClick={() => setEstOuverte(true)} estDanger />
      <FenetreModale ouverte={estOuverte} onFermer={() => setEstOuverte(false)} titre={t.titreSuppression} libelleFermer={t.fermer}>
        {estOuverte && <SuppressionElement id={id} nom={heure} action={supprimerPointage} textes={textes} onTermine={() => setEstOuverte(false)} onAnnuler={() => setEstOuverte(false)} />}
      </FenetreModale>
    </>
  );
}
