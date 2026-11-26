import "server-only";

import { tracer } from "@/lib/actions/notifier";
import { CHEMIN_ETAT, FUSEAU_HORAIRE } from "@/lib/constantes";
import { chargerEtat, type TableauEtat } from "@/lib/donnees/etats";
import { obtenirUtilisateurPourEspace } from "@/lib/donnees/session";
import { formaterDate, formaterHeure, formaterJour } from "@/lib/formats";
import { jourEtMinuteLocaux } from "@/lib/metier/dates";
import { peutAcceder } from "@/lib/metier/droits";
import { PAGE_DE_L_ETAT, type Etat } from "@/lib/metier/etats";
import { TEXTES_ETATS } from "@/lib/textes/etats";
import { TEXTES_HISTORIQUE } from "@/lib/textes/historique";
import { TEXTES_RAPPORT } from "@/lib/textes/rapport-presences";
import type { RechercheEtat } from "@/lib/validation/etats";
import { genererClasseur, type ColonneClasseur } from "./classeur";

const c = TEXTES_ETATS.colonnes;
const IDENTITE: ColonneClasseur[] = [
  { titre: c.matricule, largeur: 14, estTexte: true },
  { titre: c.employe, largeur: 26 },
  { titre: c.departement, largeur: 22 },
];

/** Colonnes de chaque état, dans l'ordre des lignes produites par chargerEtat. */
export const COLONNES_ETATS: Record<Etat, ColonneClasseur[]> = {
  presences: [
    ...IDENTITE,
    { titre: c.date, largeur: 18 },
    { titre: c.horaire, largeur: 10 },
    { titre: c.entree, largeur: 9 },
    { titre: c.sortie, largeur: 9 },
    { titre: c.travaille, largeur: 11 },
    { titre: c.retard, largeur: 10 },
    { titre: c.statut, largeur: 18 },
    { titre: c.evenement, largeur: 24 },
  ],
  evenements: [
    ...IDENTITE,
    { titre: c.code, largeur: 8 },
    { titre: c.evenement, largeur: 22 },
    { titre: c.type, largeur: 11 },
    { titre: c.periode, largeur: 36 },
    { titre: c.joursPrevus, largeur: 13 },
    { titre: c.joursValides, largeur: 13 },
    { titre: c.remarque, largeur: 28 },
  ],
  conges: [
    ...IDENTITE,
    { titre: c.code, largeur: 8 },
    { titre: c.evenement, largeur: 22 },
    { titre: c.periode, largeur: 36 },
    { titre: c.unite, largeur: 11 },
    { titre: c.total, largeur: 9 },
    { titre: c.pris, largeur: 9 },
    { titre: c.prevus, largeur: 9 },
    { titre: c.solde, largeur: 18 },
    { titre: c.etatSolde, largeur: 12 },
  ],
  "pointages-manuels": [
    { titre: c.date, largeur: 18 },
    { titre: c.heure, largeur: 8 },
    ...IDENTITE,
    { titre: c.etat, largeur: 18 },
    { titre: c.remarque, largeur: 30 },
    { titre: c.saisiPar, largeur: 22 },
  ],
};

/** Moment présent à Casablanca (statut « pas encore arrivé » d'aujourd'hui). */
export const maintenantLocal = () => {
  const { jour, minutes } = jourEtMinuteLocaux(new Date(), FUSEAU_HORAIRE);
  return { jour, minute: minutes };
};

/** Vrai si le compte connecté peut voir cet état. */
export async function peutVoirEtat(etat: Etat): Promise<boolean> {
  return peutAcceder(await obtenirUtilisateurPourEspace(), PAGE_DE_L_ETAT[etat]);
}

export type ExportEtat = TableauEtat & { titre: string; sousTitre: string; nomFichier: string; colonnes: ColonneClasseur[] };

/**
 * Vérifie les droits (page de l'état), lit l'état et trace l'export (journal du serveur et
 * historique : qui, quel état, combien de lignes, quelle période). Null sans droit.
 */
export async function preparerExportEtat(etat: Etat, format: "excel" | "pdf", recherche: RechercheEtat): Promise<ExportEtat | null> {
  const utilisateur = await obtenirUtilisateurPourEspace();
  if (!peutAcceder(utilisateur, PAGE_DE_L_ETAT[etat])) return null;

  const tableau = await chargerEtat(etat, recherche, maintenantLocal());
  // Journal d'audit (action sensible) : aucune donnée d'employé.
  console.info("Export d'un état", { utilisateurId: utilisateur.id, etat, format, lignes: tableau.lignes.length, du: recherche.du, au: recherche.au });
  const { titre } = TEXTES_ETATS.etats[etat];
  const periode = TEXTES_RAPPORT.document.periode(formaterJour(recherche.du), formaterJour(recherche.au));
  await tracer("export", "etat", `${titre} · ${TEXTES_HISTORIQUE.libelleExport(format, tableau.lignes.length)} · ${periode}`, CHEMIN_ETAT(etat));

  const maintenant = new Date();
  return {
    ...tableau,
    titre,
    sousTitre: `${periode} · ${TEXTES_ETATS.tableau.total(tableau.lignes.length)} · ${TEXTES_RAPPORT.document.genereLe(formaterDate(maintenant), formaterHeure(maintenant))}`,
    nomFichier: TEXTES_ETATS.document.nomFichier(etat, recherche.du, recherche.au),
    colonnes: COLONNES_ETATS[etat],
  };
}

/** Classeur Excel d'un état (mise en forme commune). */
export function genererClasseurEtat(donnees: ExportEtat): Promise<ArrayBuffer> {
  return genererClasseur({
    titre: donnees.titre,
    sousTitre: donnees.sousTitre,
    nomFeuille: donnees.titre.slice(0, 31),
    mention: TEXTES_RAPPORT.document.confidentiel,
    libellePage: TEXTES_RAPPORT.document.page,
    colonnes: donnees.colonnes,
    lignes: donnees.lignes,
  });
}
