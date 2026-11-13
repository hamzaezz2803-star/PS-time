"use client";

import { Plus } from "lucide-react";
import { useState, useTransition, type KeyboardEvent } from "react";
import { ajouterChampPersonnalise } from "@/app/(connecte)/personnel/personnes/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { LONGUEUR_MAX_NOM_CHAMP, TYPES_CHAMP_PERSONNALISE } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { TypeChampPersonnalise } from "@/types";

const { champsFacultatifs: textes } = TEXTES_PERSONNES;
const OPTIONS_TYPE = TYPES_CHAMP_PERSONNALISE.map((type) => ({
  valeur: type,
  libelle: textes.types[type],
}));

/**
 * Création d'un champ facultatif, envoyée par son propre bouton. Placé dans le formulaire
 * de l'employé (un formulaire ne peut pas en contenir un autre) : le serveur ignore ses valeurs
 * lors de la création de l'employé.
 */
export function AjoutChamp() {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypeChampPersonnalise>("texte");
  const [erreur, setErreur] = useState<string>();
  const [succes, setSucces] = useState<string>();
  const [enCours, demarrer] = useTransition();

  const ajouter = () =>
    demarrer(async () => {
      setSucces(undefined);
      const resultat = await ajouterChampPersonnalise({ nom, type });
      if (!resultat.ok) {
        setErreur(resultat.erreur);
        return;
      }
      setErreur(undefined);
      setNom("");
      setSucces(resultat.donnees.message);
    });

  // Entrée ajoute le champ au lieu d'envoyer tout le formulaire de l'employé.
  const surTouche = (evenement: KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key !== "Enter") return;
    evenement.preventDefault();
    if (!enCours) ajouter();
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-bordure-champ bg-fond p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
        <ChampFormulaire
          nom="nouveau-champ-nom"
          libelle={textes.nouveauChamp}
          value={nom}
          onChange={(evenement) => setNom(evenement.target.value)}
          onKeyDown={surTouche}
          placeholder={textes.exempleNouveauChamp}
          maxLength={LONGUEUR_MAX_NOM_CHAMP}
          autoComplete="off"
        />
        <ChampSelection
          nom="nouveau-champ-type"
          libelle={textes.type}
          options={OPTIONS_TYPE}
          value={type}
          onChange={(evenement) => setType(evenement.target.value as TypeChampPersonnalise)}
        />
        <Bouton
          variante="contour"
          onClick={ajouter}
          disabled={enCours}
          className="sm:mt-7"
        >
          <Plus className="size-5" aria-hidden="true" />
          {enCours ? textes.ajoutEnCours : textes.ajouter}
        </Bouton>
      </div>
      <div role="alert" aria-live="polite">
        <MessageErreur message={erreur} />
      </div>
      <MessageSucces message={succes} />
    </div>
  );
}
