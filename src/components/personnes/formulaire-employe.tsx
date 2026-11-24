"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { creerEmploye, modifierEmploye } from "@/app/(connecte)/personnel/personnes/actions";
import { ChampSite } from "@/components/sites/champ-site";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { ListeOnglets, PanneauOnglet } from "@/components/ui/onglets";
import { LONGUEUR_MAX_MATRICULE, LONGUEUR_MAX_NOM_EMPLOYE, LONGUEUR_MAX_NUMERO_BADGE } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { accesVersValeurs, CHAMPS_ACCES } from "@/lib/validation/acces-pointage";
import type { EmployeDetail, EtatFormulaireEmploye } from "@/types";
import { CadreVisage } from "./cadre-visage";
import { ChampPhoto } from "./champ-photo";
import { ChampsEmploi } from "./champs-emploi";
import { ChampsIdentiteContact } from "./champs-identite-contact";
import { ChampsPointageDistance } from "./champs-pointage-distance";
import { ChoixDoigts } from "./choix-doigts";
import { InformationsEmploye } from "./informations-employe";

const { formulaire: textes, modification } = TEXTES_PERSONNES;
/** `numeroReponse` change à chaque réponse : les champs sont alors recréés avec la saisie
 * renvoyée (React ne remet pas à jour une liste déroulante ni des lignes ajoutées après coup). */
type EtatFormulaire = EtatFormulaireEmploye & { numeroReponse: number };
const ETAT_CREATION: EtatFormulaire = { numeroReponse: 0 };

/** Valeurs initiales du formulaire en modification (les champs vides deviennent « »). */
function etatModification(employe: EmployeDetail): EtatFormulaire {
  const { id, departement, poste, site, informations, acces, ...champs } = employe;
  void id;
  void departement;
  void poste;
  void site;
  const valeurs = {
    ...Object.fromEntries(Object.entries(champs).map(([nom, valeur]) => [nom, typeof valeur === "string" ? valeur : ""])),
    ...accesVersValeurs(acces),
  };
  return { numeroReponse: 0, valeurs, informations };
}
const obligatoire = (libelle: string) => `${libelle} *`;

const ONGLETS = ["identite-contact", "emploi", "informations", "distance", "biometrie"] as const;
type IdOnglet = (typeof ONGLETS)[number];

/** Onglet de chaque champ facultatif, pour y signaler les erreurs et l'ouvrir. */
function ongletDuChamp(cle: string): IdOnglet | null {
  if (["genre", "typePieceIdentite", "numeroPieceIdentite", "telephone", "email"].includes(cle)) return "identite-contact";
  if (["typeEmploi", "dateEmbauche", "dateDebutEmploi", "dateFinEmploi"].includes(cle)) return "emploi";
  if (cle.startsWith("information_")) return "informations";
  if (cle === CHAMPS_ACCES.appareils) return "distance";
  return null;
}

function compterErreurs(erreurs: EtatFormulaireEmploye["erreursChamps"]): Record<IdOnglet, number> {
  const nombres: Record<IdOnglet, number> = { "identite-contact": 0, emploi: 0, informations: 0, distance: 0, biometrie: 0 };
  for (const [cle, message] of Object.entries(erreurs ?? {})) {
    const onglet = ongletDuChamp(cle);
    if (message && onglet) nombres[onglet] += 1;
  }
  return nombres;
}

/**
 * Création (sans `employe`) ou modification d'un employé, sur le modèle CVAccess : l'essentiel
 * en haut, toujours visible, puis les informations facultatives en onglets. En création, les deux
 * boutons se distinguent par `apresCreation` (fermer la fenêtre ou en saisir un autre).
 */
export function FormulaireEmploye({
  departements,
  postes,
  sites,
  employe,
  onReussite,
  onAnnuler,
}: {
  departements: OptionSelection[];
  postes: OptionSelection[];
  sites: OptionSelection[];
  employe?: EmployeDetail;
  onReussite: (message: string, continuer: boolean) => void;
  onAnnuler: () => void;
}) {
  const enregistrer = employe ? modifierEmploye : creerEmploye;
  const [onglet, setOnglet] = useState<IdOnglet>("identite-contact");
  const [etat, action, enCours] = useActionState(
    async (precedent: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> => {
      const continuer = formulaire.get("apresCreation") === "continuer";
      const resultat = await enregistrer(precedent, formulaire);
      if (resultat.succes) {
        setOnglet("identite-contact");
        onReussite(resultat.succes, continuer);
      } else {
        // Ouvre le premier onglet facultatif qui contient une erreur (l'essentiel reste visible).
        const nombres = compterErreurs(resultat.erreursChamps);
        const ongletEnErreur = ONGLETS.find((id) => nombres[id] > 0);
        if (ongletEnErreur) setOnglet(ongletEnErreur);
      }
      return { ...resultat, numeroReponse: precedent.numeroReponse + 1 };
    },
    employe ? etatModification(employe) : ETAT_CREATION,
  );
  const erreurs = etat.erreursChamps;
  const valeurs = etat.valeurs ?? {};
  const nombresErreurs = compterErreurs(erreurs);
  const onglets = [
    { id: "identite-contact", libelle: textes.ongletIdentiteContact },
    { id: "emploi", libelle: textes.ongletEmploi },
    { id: "informations", libelle: textes.ongletInformations },
    { id: "distance", libelle: textes.ongletDistance },
    { id: "biometrie", libelle: textes.ongletBiometrie },
  ].map((definition) => ({
    ...definition,
    nombreErreurs: nombresErreurs[definition.id as IdOnglet],
    libelleErreurs: textes.erreursOnglet,
  }));

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {employe && <input type="hidden" name="id" value={employe.id} />}
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {/* Hors du bloc recréé après chaque réponse : la photo choisie reste en cas d'erreur. */}
        <ChampPhoto employeId={employe?.id} photoModifieeLe={employe?.photoModifieeLe ?? null} erreur={erreurs?.photo} />
        <div key={etat.numeroReponse} className="mt-6">
        <fieldset className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <legend className="mb-3 flex w-full items-baseline justify-between gap-4">
            <span className="text-base font-semibold text-marine">{textes.sectionPrincipale}</span>
            <span className="text-sm text-texte-secondaire">* {textes.obligatoire}</span>
          </legend>
          <ChampFormulaire nom="matricule" libelle={obligatoire(textes.matricule)} defaultValue={valeurs.matricule ?? ""} maxLength={LONGUEUR_MAX_MATRICULE} autoComplete="off" spellCheck={false} required aide={textes.aideMatricule} erreur={erreurs?.matricule} />
          <ChampFormulaire nom="numeroBadge" libelle={obligatoire(textes.numeroBadge)} defaultValue={valeurs.numeroBadge ?? ""} maxLength={LONGUEUR_MAX_NUMERO_BADGE} autoComplete="off" spellCheck={false} required aide={textes.aideBadge} erreur={erreurs?.numeroBadge} />
          <ChampFormulaire nom="prenom" libelle={obligatoire(textes.prenom)} defaultValue={valeurs.prenom ?? ""} maxLength={LONGUEUR_MAX_NOM_EMPLOYE} autoComplete="off" required erreur={erreurs?.prenom} />
          <ChampFormulaire nom="nom" libelle={obligatoire(textes.nom)} defaultValue={valeurs.nom ?? ""} maxLength={LONGUEUR_MAX_NOM_EMPLOYE} autoComplete="off" required erreur={erreurs?.nom} />
          <ChampSite sites={sites} valeurInitiale={valeurs.siteId || null} erreur={erreurs?.siteId} />
          <ChampSelection nom="departementId"libelle={obligatoire(textes.departement)} options={departements} optionVide={textes.choisirDepartement} defaultValue={valeurs.departementId ?? ""} required erreur={erreurs?.departementId} />
          <ChampSelection nom="posteId" libelle={textes.poste} options={postes} optionVide={textes.aucunPoste} defaultValue={valeurs.posteId ?? ""} erreur={erreurs?.posteId} />
        </fieldset>

        <div className="mt-7">
          <ListeOnglets base="employe" libelle={textes.ongletsFacultatifs} actif={onglet} onChanger={(id) => setOnglet(id as IdOnglet)} onglets={onglets} />
          <PanneauOnglet base="employe" id="identite-contact" actif={onglet}>
            <ChampsIdentiteContact valeurs={valeurs} erreurs={erreurs} />
          </PanneauOnglet>
          <PanneauOnglet base="employe" id="emploi" actif={onglet}>
            <ChampsEmploi valeurs={valeurs} erreurs={erreurs} />
          </PanneauOnglet>
          <PanneauOnglet base="employe" id="informations" actif={onglet}>
            <InformationsEmploye initiales={etat.informations ?? []} erreurs={erreurs} />
          </PanneauOnglet>
          <PanneauOnglet base="employe" id="distance" actif={onglet}>
            <ChampsPointageDistance valeurs={valeurs} erreurs={erreurs} />
          </PanneauOnglet>
          <PanneauOnglet base="employe" id="biometrie" actif={onglet}>
            <div className="flex flex-col gap-8">
              {/* Caméra montée seulement onglet ouvert : la quitter coupe la caméra. */}
              {onglet === "biometrie" && <CadreVisage />}
              <ChoixDoigts valeurInitiale={valeurs[CHAMPS_ACCES.doigts] ?? ""} />
            </div>
          </PanneauOnglet>
        </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-bordure bg-fond px-5 py-3 sm:px-6">
        <div role="alert" aria-live="polite">
          <MessageErreur message={etat.message} className="mb-3 rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
        </div>
        {/* Le bouton principal vient en premier dans le code : c'est lui que déclenche la touche Entrée. */}
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <Bouton type="submit" name="apresCreation" value="fermer" disabled={enCours}>
            {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {enCours
              ? (employe ? modification.enregistrementEnCours : textes.enregistrementEnCours)
              : (employe ? modification.enregistrer : textes.enregistrer)}
          </Bouton>
          {!employe && (
            <Bouton type="submit" name="apresCreation" value="continuer" variante="contour" disabled={enCours}>
              {textes.creerEtContinuer}
            </Bouton>
          )}
          <Bouton variante="fantome" onClick={onAnnuler}>{textes.annuler}</Bouton>
        </div>
      </div>
    </form>
  );
}
