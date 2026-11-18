import "server-only";

import { tracer } from "@/lib/actions/notifier";
import { CHEMIN_PERSONNES, EXPORT_EMPLOYES_MAX, FUSEAU_HORAIRE } from "@/lib/constantes";
import { listerEmployesPourExport } from "@/lib/donnees/employes";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { peutAcceder } from "@/lib/metier/droits";
import { formaterDate, formaterHeure, formaterJour } from "@/lib/formats";
import { jourDansFuseau } from "@/lib/metier/dates";
import { versLigneExport, type LigneExportEmploye } from "@/lib/metier/export-employes";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { aDesCriteres, type RechercheEmployes } from "@/lib/validation/recherche-employes";

const { export: textes, liste } = TEXTES_PERSONNES;

export type ExportEmployes = {
  lignes: LigneExportEmploye[];
  /** « Généré le … à … · N employés ». */
  sousTitre: string;
  nomFichier: string;
  estTronque: boolean;
};

/**
 * Vérifie les droits, lit et met en forme la liste à exporter, et trace l'export.
 * Renvoie null si l'utilisateur n'est pas super administrateur (données personnelles).
 */
export async function preparerExportEmployes(format: "excel" | "pdf", recherche: RechercheEmployes): Promise<ExportEmployes | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, "personnes")) return null;

  // Une ligne de plus que le maximum : savoir si la liste a été coupée.
  const employes = await listerEmployesPourExport(EXPORT_EMPLOYES_MAX + 1, recherche);
  const estTronque = employes.length > EXPORT_EMPLOYES_MAX;
  const lignes = employes.slice(0, EXPORT_EMPLOYES_MAX).map((employe) => versLigneExport(employe, formaterJour));

  // Journal d'audit (action sensible) : qui, quoi, combien. Aucune donnée d'employé.
  console.info("Export de la liste des employés", { utilisateurId: utilisateur.id, format, lignes: lignes.length, filtre: aDesCriteres(recherche) });
  await tracer("export", "employe", TEXTES_HISTORIQUE.libelleExport(format, lignes.length), CHEMIN_PERSONNES);

  const maintenant = new Date();
  return {
    lignes,
    sousTitre: `${textes.genereLe(formaterDate(maintenant), formaterHeure(maintenant))} · ${liste.total(lignes.length)}`,
    nomFichier: textes.nomFichier(jourDansFuseau(maintenant, FUSEAU_HORAIRE)),
    estTronque,
  };
}
