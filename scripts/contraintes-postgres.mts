/**
 * Contraintes CHECK de la base, écrites pour PostgreSQL. phpMyAdmin ne les exporte pas : elles
 * reprennent une à une celles de src/lib/donnees/schema.ts (mêmes noms), avec les listes tirées
 * des constantes de l'application. Utilisé par scripts/mysql-vers-postgres.mts.
 */
import {
  ACTIONS_HISTORIQUE,
  COULEURS_PERSONNALISABLES,
  COULEURS_REGLE,
  DUREE_EVENEMENT_MAX_MINUTES,
  MODULES_HISTORIQUE,
  PAGES,
  PIECE_JOINTE_TAILLE_MAX_OCTETS,
  POLICES,
  TAILLES_TEXTE,
  THEMES,
  TYPES_EVENEMENT,
  TYPES_PIECE_JOINTE,
  UNITES_SAISIE_EVENEMENT,
} from "../src/lib/constantes.ts";

/** Liste SQL `'a', 'b'` tirée d'une constante (valeurs fixes, jamais saisies). */
const liste = (valeurs: readonly string[]) => valeurs.map((valeur) => `'${valeur}'`).join(", ");
const nonVide = (colonne: string) => `char_length(trim(${colonne})) > 0`;
const parDemiJournee = (colonne: string) => `${colonne} BETWEEN 0 AND 366 AND ${colonne} * 2 = floor(${colonne} * 2)`;
const couleursPersonnalisees = COULEURS_PERSONNALISABLES.map((couleur) => `couleur_${couleur}`);

/** Contraintes par table : [nom, expression]. */
export const CONTRAINTES: Record<string, [string, string][]> = {
  utilisateurs: [
    ["utilisateurs_email_minuscules", "email = lower(email)"],
    ["utilisateurs_identifiant_minuscules", "identifiant = lower(identifiant)"],
    ["utilisateurs_nom_non_vide", nonVide("nom")],
  ],
  autorisations_pages: [["autorisations_pages_page_valide", `page IN (${liste(PAGES)})`]],
  parametres: [
    [
      "parametres_valeur_valide",
      `(cle = 'theme' AND valeur IN (${liste(THEMES)})) OR (cle = 'police' AND valeur IN (${liste(POLICES)})) OR (cle = 'taille_texte' AND valeur IN (${liste(TAILLES_TEXTE)})) OR (cle IN (${liste(couleursPersonnalisees)}) AND valeur ~ '^#[0-9a-f]{6}$')`,
    ],
  ],
  notifications: [
    ["notifications_module_valide", "module IN ('personnel', 'planning', 'presence', 'administration')"],
    ["notifications_action_valide", "action IN ('creation', 'modification', 'suppression')"],
  ],
  historique: [
    ["historique_action_valide", `action IN (${liste(ACTIONS_HISTORIQUE)})`],
    ["historique_module_valide", `module IN (${liste(MODULES_HISTORIQUE)})`],
  ],
  sites: [["sites_nom_non_vide", nonVide("nom")]],
  departements: [
    ["departements_nom_non_vide", nonVide("nom")],
    ["departements_pas_son_propre_parent", "parent_id IS NULL OR parent_id <> id"],
  ],
  postes: [
    ["postes_code_non_vide", nonVide("code")],
    ["postes_nom_non_vide", nonVide("nom")],
    ["postes_ordre_borne", "ordre BETWEEN 0 AND 99999"],
    ["postes_pas_son_propre_parent", "parent_id IS NULL OR parent_id <> id"],
  ],
  employes: [
    ["employes_appareils_distance_valides", "appareils_distance ~ '^((pc|tablette|telephone)(,(pc|tablette|telephone)){0,2})?$'"],
    ["employes_doigts_valides", "doigts_a_enroler ~ '^[0-9]{0,10}$'"],
    ["employes_distance_coherente", "pointage_distance OR (appareils_distance = '' AND NOT distance_exige_position AND NOT distance_exige_photo)"],
    ["employes_matricule_non_vide", nonVide("matricule")],
    ["employes_prenom_non_vide", nonVide("prenom")],
    ["employes_nom_non_vide", nonVide("nom")],
    ["employes_numero_badge_non_vide", nonVide("numero_badge")],
    ["employes_genre_valide", "genre IS NULL OR genre IN ('homme', 'femme')"],
    ["employes_type_piece_valide", "type_piece_identite IS NULL OR type_piece_identite IN ('cin', 'passeport', 'carte_sejour')"],
    ["employes_piece_complete", "(type_piece_identite IS NULL) = (numero_piece_identite IS NULL)"],
    ["employes_email_minuscules", "email IS NULL OR email = lower(email)"],
    ["employes_telephone_e164", "telephone IS NULL OR telephone ~ '^[+][1-9][0-9]{7,14}$'"],
    ["employes_type_emploi_valide", "type_emploi IS NULL OR type_emploi IN ('cdi', 'cdd', 'interim', 'stage')"],
    ["employes_dates_emploi_coherentes", "date_fin_emploi IS NULL OR date_embauche IS NULL OR date_fin_emploi >= date_embauche"],
    ["employes_debut_avant_fin", "date_fin_emploi IS NULL OR date_debut_emploi IS NULL OR date_fin_emploi >= date_debut_emploi"],
  ],
  informations_employes: [
    ["informations_employes_libelle_non_vide", nonVide("libelle")],
    ["informations_employes_valeur_non_vide", nonVide("valeur")],
  ],
  photos_employes: [
    ["photos_employes_type_mime", "type_mime IN ('image/jpeg', 'image/png', 'image/webp')"],
    ["photos_employes_taille", "taille_octets BETWEEN 1 AND 524288"],
  ],
  pointages: [
    ["pointages_etat", "etat IN ('entree', 'sortie', 'debut_pause', 'fin_pause', 'debut_heures_sup', 'fin_heures_sup')"],
    ["pointages_source", "source IN ('manuel', 'badgeuse')"],
  ],
  profils_horaires: [
    ["profils_horaires_code_valide", "code ~ '^[A-Z0-9]{1,3}$'"],
    ["profils_horaires_nom_non_vide", nonVide("nom")],
    ["profils_horaires_type_valide", "type IN ('travail', 'repos')"],
    ["profils_horaires_repas_borne", "(repas_minimum_minutes IS NULL OR repas_minimum_minutes BETWEEN 0 AND 720) AND (repas_maximum_minutes IS NULL OR repas_maximum_minutes BETWEEN 0 AND 720)"],
  ],
  plages_profils: [
    ["plages_profils_bornes", "debut_minutes BETWEEN 0 AND 1439 AND fin_minutes BETWEEN 1 AND 1440 AND fin_minutes > debut_minutes"],
    ["plages_profils_type_valide", "type IN ('interdite', 'neutralisee', 'variable', 'fixe', 'repas', 'retard_tolere')"],
  ],
  groupes: [["groupes_nom_non_vide", nonVide("nom")]],
  rotations: [
    ["rotations_nom_non_vide", nonVide("nom")],
    ["rotations_type_et_duree", "(type = 'hebdomadaire' AND nombre_jours = 7) OR (type = 'cycle' AND nombre_jours BETWEEN 1 AND 31)"],
  ],
  jours_rotation: [["jours_rotation_numero_borne", "numero_jour BETWEEN 0 AND 30"]],
  affectations: [
    ["affectations_une_seule_cible", "(groupe_id IS NULL) <> (employe_id IS NULL)"],
    ["affectations_dates_coherentes", "date_fin IS NULL OR date_fin >= date_debut"],
  ],
  regles_horaires: [
    ["regles_horaires_couleur_valide", `couleur IN (${liste(COULEURS_REGLE)})`],
    ["regles_horaires_bornes", "debut_minutes BETWEEN 0 AND 1439 AND fin_minutes BETWEEN 1 AND 1440 AND fin_minutes > debut_minutes"],
    ["regles_horaires_jours_valides", "jours_semaine ~ '^[1-7]{1,7}$'"],
  ],
  compteurs: [
    ["compteurs_code_valide", "code ~ '^[A-Z0-9][A-Z0-9_-]{0,29}$'"],
    ["compteurs_libelle_non_vide", nonVide("libelle")],
    ["compteurs_formule_non_vide", nonVide("formule")],
    ["compteurs_une_periodicite", "journalier OR hebdomadaire OR mensuel"],
    ["compteurs_unite_valide", "unite IN ('minutes', 'heures', 'jours', 'nombre', 'pourcentage')"],
    ["compteurs_version_positive", "version >= 1"],
  ],
  evenements: [
    ["evenements_code_valide", "code ~ '^[A-Z0-9]{1,3}$'"],
    ["evenements_nom_non_vide", nonVide("nom")],
    ["evenements_type_valide", `type IN (${liste(TYPES_EVENEMENT)})`],
    ["evenements_priorite_bornee", "priorite BETWEEN 0 AND 255"],
    ["evenements_unite_valide", `unite_saisie IN (${liste(UNITES_SAISIE_EVENEMENT)})`],
    ["evenements_duree_coherente", `(unite_saisie = 'heures' AND duree_minutes BETWEEN 1 AND ${DUREE_EVENEMENT_MAX_MINUTES}) OR (unite_saisie <> 'heures' AND duree_minutes IS NULL)`],
  ],
  evenements_employes: [
    ["evenements_employes_dates_coherentes", "date_fin >= date_debut"],
    ["evenements_employes_heures_valides", "(debut_minutes IS NULL AND fin_minutes IS NULL) OR (date_debut = date_fin AND debut_minutes >= 0 AND fin_minutes <= 1440 AND debut_minutes < fin_minutes)"],
  ],
  droits_conges: [
    ["droits_conges_dates_coherentes", "date_fin >= date_debut"],
    ["droits_conges_acquis_valide", parDemiJournee("jours_acquis")],
    ["droits_conges_reliquat_valide", parDemiJournee("jours_reliquat")],
    ["droits_conges_supplement_1_valide", parDemiJournee("supplement_1")],
    ["droits_conges_supplement_2_valide", parDemiJournee("supplement_2")],
    ["droits_conges_supplement_3_valide", parDemiJournee("supplement_3")],
    ["droits_conges_unite_valide", `unite_saisie IN (${liste(UNITES_SAISIE_EVENEMENT)})`],
  ],
  pieces_jointes: [
    ["pieces_jointes_type_mime", `type_mime IN (${liste(TYPES_PIECE_JOINTE)})`],
    ["pieces_jointes_taille", `taille_octets BETWEEN 1 AND ${PIECE_JOINTE_TAILLE_MAX_OCTETS}`],
    ["pieces_jointes_nom_non_vide", nonVide("nom_fichier")],
  ],
};
