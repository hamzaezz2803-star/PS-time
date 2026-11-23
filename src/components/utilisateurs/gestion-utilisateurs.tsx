"use client";

import { CircleCheck, CircleSlash, KeyRound, ShieldCheck, UserCog } from "lucide-react";
import { supprimerCompte } from "@/app/(connecte)/administration/utilisateurs/actions";
import { GestionListe, type ColonneListe } from "@/components/liste/gestion-liste";
import { Pastille } from "@/components/ui/pastille";
import { MODULES } from "@/lib/constantes";
import { pagesProposees } from "@/lib/metier/droits";
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

function Role({ utilisateur }: { utilisateur: UtilisateurListe }) {
  return utilisateur.estSuperAdmin ? (
    <Pastille Icone={ShieldCheck}>{textes.roles.superAdmin}</Pastille>
  ) : (
    <Pastille ton="neutre" Icone={UserCog}>{textes.roles.admin}</Pastille>
  );
}

/** Résumé des pages accordées, module par module (« Personnel : tout », « Planning : 2 sur 6 »). */
function Autorisations({ utilisateur }: { utilisateur: UtilisateurListe }) {
  if (utilisateur.estSuperAdmin) return <Pastille ton="neutre">{textes.toutesLesPages}</Pastille>;
  const resumes = MODULES.flatMap((module) => {
    const pages = pagesProposees(module);
    const accordees = pages.filter((page) => utilisateur.pages.includes(page)).length;
    return accordees > 0 ? [{ module, texte: textes.resumeModule(textes.modules[module], accordees, pages.length) }] : [];
  });
  if (resumes.length === 0) return <Pastille ton="neutre">{textes.aucunePage}</Pastille>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {resumes.map(({ module, texte }) => (
        <Pastille key={module} ton="neutre">{texte}</Pastille>
      ))}
    </span>
  );
}

function Etat({ utilisateur }: { utilisateur: UtilisateurListe }) {
  if (!utilisateur.estActif) return <Pastille ton="attention" Icone={CircleSlash}>{textes.etats.desactive}</Pastille>;
  if (utilisateur.doitChangerMotDePasse) return <Pastille ton="neutre" Icone={KeyRound}>{textes.etats.motDePasseProvisoire}</Pastille>;
  return <Pastille ton="succes" Icone={CircleCheck}>{textes.etats.actif}</Pastille>;
}

/** Comptes de l'installation : création d'administrateurs, pages autorisées, état et suppression. */
export function GestionUtilisateurs({ utilisateurs, idConnecte }: { utilisateurs: UtilisateurListe[]; idConnecte: string }) {
  const colonnes: ColonneListe<UtilisateurListe>[] = [
    { titre: textes.colonnes.compte, rendu: (u) => <Compte utilisateur={u} estVous={u.id === idConnecte} /> },
    { titre: textes.colonnes.role, rendu: (u) => <Role utilisateur={u} /> },
    { titre: textes.colonnes.pages, rendu: (u) => <Autorisations utilisateur={u} /> },
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
