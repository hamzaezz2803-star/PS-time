import type { EmployeListe } from "@/types";
import { formaterTelephone } from "./employes.ts";

/** Une ligne exportée : uniquement du texte, prêt pour Excel ou le PDF. */
export type LigneExportEmploye = {
  matricule: string;
  numeroBadge: string;
  nom: string;
  prenom: string;
  departement: string;
  poste: string;
  telephone: string;
  dateEmbauche: string;
};

/** Colonnes de l'export, dans l'ordre, avec leur largeur Excel (en caractères). */
export const COLONNES_EXPORT_EMPLOYES: { cle: keyof LigneExportEmploye; largeur: number }[] = [
  { cle: "matricule", largeur: 14 },
  { cle: "numeroBadge", largeur: 12 },
  { cle: "nom", largeur: 22 },
  { cle: "prenom", largeur: 20 },
  { cle: "departement", largeur: 26 },
  { cle: "poste", largeur: 24 },
  { cle: "telephone", largeur: 18 },
  { cle: "dateEmbauche", largeur: 18 },
];

/**
 * Met en forme un employé pour l'export. Les champs vides restent vides (pas de
 * « Non renseigné ») pour que les filtres et tris d'Excel fonctionnent.
 */
export function versLigneExport(employe: EmployeListe, formaterJour: (jour: string) => string): LigneExportEmploye {
  return {
    matricule: employe.matricule,
    numeroBadge: employe.numeroBadge,
    nom: employe.nom,
    prenom: employe.prenom,
    departement: employe.departement,
    poste: employe.poste ?? "",
    telephone: employe.telephone ? formaterTelephone(employe.telephone) : "",
    dateEmbauche: employe.dateEmbauche ? formaterJour(employe.dateEmbauche) : "",
  };
}
