"use client";

import { CircleCheck, CircleSlash, KeyRound, ShieldCheck, UserCog } from "lucide-react";
import { supprimerCompte } from "@/app/(connecte)/administration/utilisateurs/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { formaterDate } from "@/lib/formats";
import { TEXTES_UTILISATEURS as textes } from "@/lib/textes/utilisateurs";
import type { UtilisateurListe } from "@/types";
import { FormulaireUtilisateur } from "./formulaire-utilisateur";

function Compte({ utilisateur, estVous }: { utilisateur: UtilisateurListe; estVous: boolean }) {
  return (
    <span className="flex flex-col">
      <span className="font-medium text-texte">
        {utilisateur.nomComplet}
        {estVous && <span className="ms-1.5 text-sm font-normal text-texte-secondaire">({textes.vous})</span>}
      </span>
      <span className="font-mono text-sm text-texte-secondaire">{utilisateur.identifiant}</span>
    </span>
  );
}

function Modules({ utilisateur }: { utilisateur: UtilisateurListe }) {
  if (utilisateur.estSuperAdmin) return <Pastille Icone={ShieldCheck}>{textes.roles.superAdmin}</Pastille>;
  if (utilisateur.modules.length === 0) return <Pastille ton="neutre">{textes.aucunModule}</Pastille>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {utilisateur.modules.map((module) => (
        <Pastille key={module} ton="neutre">{textes.modules[module].libelle}</Pastille>
      ))}
    </span>
  );
}

function Etat({ utilisateur }: { utilisateur: UtilisateurListe }) {
  if (!utilisateur.estActif) return <Pastille ton="attention" Icone={CircleSlash}>{textes.etats.desactive}</Pastille>;
  if (utilisateur.doitChangerMotDePasse) return <Pastille ton="neutre" Icone={KeyRound}>{textes.etats.motDePasseProvisoire}</Pastille>;
  return <Pastille ton="succes" Icone={CircleCheck}>{textes.etats.actif}</Pastille>;
}

/** Comptes de l'installation : création d'administrateurs, modules autorisés, état et suppression. */
export function GestionUtilisateurs({ utilisateurs, idConnecte }: { utilisateurs: UtilisateurListe[]; idConnecte: string }) {
  const colonnes: ColonneListe<UtilisateurListe>[] = [
    { titre: textes.colonnes.compte, rendu: (u) => <Compte utilisateur={u} estVous={u.id === idConnecte} /> },
    { titre: textes.colonnes.modules, rendu: (u) => <Modules utilisateur={u} /> },
    { titre: textes.colonnes.etat, rendu: (u) => <Etat utilisateur={u} /> },
    {
      titre: textes.colonnes.modifie,
      estSecondaire: true,
      rendu: (u) => <span className="text-sm tabular-nums text-texte-secondaire">{formaterDate(u.modifieLe)}</span>,
    },
  ];
  return (
    <GestionListe
      elements={utilisateurs}
      colonnes={colonnes}
      textes={textes}
      icone={UserCog}
      rendreFormulaire={(proprietes) => <FormulaireUtilisateur {...proprietes} />}
      actionSupprimer={supprimerCompte}
    />
  );
}
