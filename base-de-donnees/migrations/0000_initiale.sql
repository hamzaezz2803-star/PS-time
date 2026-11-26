CREATE TABLE "affectations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"groupe_id" uuid,
	"employe_id" uuid,
	"date_debut" date NOT NULL,
	"date_fin" date,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affectations_une_seule_cible" CHECK (("affectations"."groupe_id" IS NULL) <> ("affectations"."employe_id" IS NULL)),
	CONSTRAINT "affectations_dates_coherentes" CHECK ("affectations"."date_fin" IS NULL OR "affectations"."date_fin" >= "affectations"."date_debut")
);
--> statement-breakpoint
CREATE TABLE "autorisations_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"page" varchar(30) NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "autorisations_pages_page_valide" CHECK ("autorisations_pages"."page" IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'absences', 'droits_conges', 'compteurs', 'detail_jour', 'etat_presences', 'etat_evenements', 'etat_conges', 'etat_pointages'))
);
--> statement-breakpoint
CREATE TABLE "comptes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"fournisseur_id" varchar(50) NOT NULL,
	"compte_id" varchar(255) NOT NULL,
	"mot_de_passe" varchar(255),
	"jeton_acces" text,
	"jeton_rafraichissement" text,
	"jeton_identite" text,
	"jeton_acces_expire_le" timestamp (3) with time zone,
	"jeton_rafraichissement_expire_le" timestamp (3) with time zone,
	"portee" varchar(500),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compteurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"libelle" varchar(100) NOT NULL,
	"formule" varchar(2000) NOT NULL,
	"journalier" boolean DEFAULT false NOT NULL,
	"hebdomadaire" boolean DEFAULT false NOT NULL,
	"mensuel" boolean DEFAULT false NOT NULL,
	"unite" varchar(12) NOT NULL,
	"description" varchar(500),
	"est_actif" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"cree_par" uuid,
	"modifie_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compteurs_code_valide" CHECK ("compteurs"."code" ~ '^[A-Z0-9][A-Z0-9_-]{0,29}$'),
	CONSTRAINT "compteurs_libelle_non_vide" CHECK (char_length(trim("compteurs"."libelle")) > 0),
	CONSTRAINT "compteurs_formule_non_vide" CHECK (char_length(trim("compteurs"."formule")) > 0),
	CONSTRAINT "compteurs_une_periodicite" CHECK ("compteurs"."journalier" OR "compteurs"."hebdomadaire" OR "compteurs"."mensuel"),
	CONSTRAINT "compteurs_unite_valide" CHECK ("compteurs"."unite" IN ('minutes', 'heures', 'jours', 'nombre', 'pourcentage')),
	CONSTRAINT "compteurs_version_positive" CHECK ("compteurs"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "compteurs_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compteur_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"formule" varchar(2000) NOT NULL,
	"journalier" boolean NOT NULL,
	"hebdomadaire" boolean NOT NULL,
	"mensuel" boolean NOT NULL,
	"unite" varchar(12) NOT NULL,
	"modifie_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(100) NOT NULL,
	"parent_id" uuid,
	"site_id" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departements_nom_non_vide" CHECK (char_length(trim("departements"."nom")) > 0),
	CONSTRAINT "departements_pas_son_propre_parent" CHECK ("departements"."parent_id" IS NULL OR "departements"."parent_id" <> "departements"."id")
);
--> statement-breakpoint
CREATE TABLE "droits_conges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employe_id" uuid NOT NULL,
	"evenement_id" uuid NOT NULL,
	"date_debut" date NOT NULL,
	"date_fin" date NOT NULL,
	"jours_acquis" numeric(4, 1) NOT NULL,
	"jours_reliquat" numeric(4, 1) DEFAULT 0 NOT NULL,
	"supplement_1" numeric(4, 1) DEFAULT 0 NOT NULL,
	"supplement_2" numeric(4, 1) DEFAULT 0 NOT NULL,
	"supplement_3" numeric(4, 1) DEFAULT 0 NOT NULL,
	"unite_saisie" varchar(15) DEFAULT 'journee' NOT NULL,
	"est_confirme" boolean DEFAULT true NOT NULL,
	"est_reporte" boolean DEFAULT false NOT NULL,
	"est_bloquant" boolean DEFAULT false NOT NULL,
	"remarque" varchar(255),
	"saisi_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "droits_conges_dates_coherentes" CHECK ("droits_conges"."date_fin" >= "droits_conges"."date_debut"),
	CONSTRAINT "droits_conges_acquis_valide" CHECK ("droits_conges"."jours_acquis" BETWEEN 0 AND 366 AND "droits_conges"."jours_acquis" * 2 = floor("droits_conges"."jours_acquis" * 2)),
	CONSTRAINT "droits_conges_reliquat_valide" CHECK ("droits_conges"."jours_reliquat" BETWEEN 0 AND 366 AND "droits_conges"."jours_reliquat" * 2 = floor("droits_conges"."jours_reliquat" * 2)),
	CONSTRAINT "droits_conges_supplement_1_valide" CHECK ("droits_conges"."supplement_1" BETWEEN 0 AND 366 AND "droits_conges"."supplement_1" * 2 = floor("droits_conges"."supplement_1" * 2)),
	CONSTRAINT "droits_conges_supplement_2_valide" CHECK ("droits_conges"."supplement_2" BETWEEN 0 AND 366 AND "droits_conges"."supplement_2" * 2 = floor("droits_conges"."supplement_2" * 2)),
	CONSTRAINT "droits_conges_supplement_3_valide" CHECK ("droits_conges"."supplement_3" BETWEEN 0 AND 366 AND "droits_conges"."supplement_3" * 2 = floor("droits_conges"."supplement_3" * 2)),
	CONSTRAINT "droits_conges_unite_valide" CHECK ("droits_conges"."unite_saisie" IN ('journee', 'demi_journee', 'heures'))
);
--> statement-breakpoint
CREATE TABLE "droits_conges_pieces_jointes" (
	"droit_id" uuid NOT NULL,
	"piece_jointe_id" uuid NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "droits_conges_pieces_jointes_pkey" PRIMARY KEY("droit_id","piece_jointe_id")
);
--> statement-breakpoint
CREATE TABLE "employes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matricule" varchar(30) NOT NULL,
	"numero_badge" varchar(30) NOT NULL,
	"prenom" varchar(100) NOT NULL,
	"nom" varchar(100) NOT NULL,
	"departement_id" uuid NOT NULL,
	"poste_id" uuid,
	"groupe_id" uuid,
	"site_id" uuid,
	"telephone" varchar(16),
	"email" varchar(254),
	"genre" varchar(10),
	"type_piece_identite" varchar(20),
	"numero_piece_identite" varchar(30),
	"type_emploi" varchar(20),
	"date_embauche" date,
	"date_debut_emploi" date,
	"date_fin_emploi" date,
	"horaire_dynamique" boolean DEFAULT false NOT NULL,
	"pointage_distance" boolean DEFAULT false NOT NULL,
	"appareils_distance" varchar(30) DEFAULT '' NOT NULL,
	"distance_exige_position" boolean DEFAULT false NOT NULL,
	"distance_exige_photo" boolean DEFAULT false NOT NULL,
	"doigts_a_enroler" varchar(10) DEFAULT '' NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employes_appareils_distance_valides" CHECK ("employes"."appareils_distance" ~ '^((pc|tablette|telephone)(,(pc|tablette|telephone)){0,2})?$'),
	CONSTRAINT "employes_doigts_valides" CHECK ("employes"."doigts_a_enroler" ~ '^[0-9]{0,10}$'),
	CONSTRAINT "employes_distance_coherente" CHECK ("employes"."pointage_distance" OR ("employes"."appareils_distance" = '' AND NOT "employes"."distance_exige_position" AND NOT "employes"."distance_exige_photo")),
	CONSTRAINT "employes_matricule_non_vide" CHECK (char_length(trim("employes"."matricule")) > 0),
	CONSTRAINT "employes_prenom_non_vide" CHECK (char_length(trim("employes"."prenom")) > 0),
	CONSTRAINT "employes_nom_non_vide" CHECK (char_length(trim("employes"."nom")) > 0),
	CONSTRAINT "employes_numero_badge_non_vide" CHECK (char_length(trim("employes"."numero_badge")) > 0),
	CONSTRAINT "employes_genre_valide" CHECK ("employes"."genre" IS NULL OR "employes"."genre" IN ('homme', 'femme')),
	CONSTRAINT "employes_type_piece_valide" CHECK ("employes"."type_piece_identite" IS NULL OR "employes"."type_piece_identite" IN ('cin', 'passeport', 'carte_sejour')),
	CONSTRAINT "employes_piece_complete" CHECK (("employes"."type_piece_identite" IS NULL) = ("employes"."numero_piece_identite" IS NULL)),
	CONSTRAINT "employes_email_minuscules" CHECK ("employes"."email" IS NULL OR "employes"."email" = lower("employes"."email")),
	CONSTRAINT "employes_telephone_e164" CHECK ("employes"."telephone" IS NULL OR "employes"."telephone" ~ '^[+][1-9][0-9]{7,14}$'),
	CONSTRAINT "employes_type_emploi_valide" CHECK ("employes"."type_emploi" IS NULL OR "employes"."type_emploi" IN ('cdi', 'cdd', 'interim', 'stage')),
	CONSTRAINT "employes_dates_emploi_coherentes" CHECK ("employes"."date_fin_emploi" IS NULL OR "employes"."date_embauche" IS NULL OR "employes"."date_fin_emploi" >= "employes"."date_embauche"),
	CONSTRAINT "employes_debut_avant_fin" CHECK ("employes"."date_fin_emploi" IS NULL OR "employes"."date_debut_emploi" IS NULL OR "employes"."date_fin_emploi" >= "employes"."date_debut_emploi")
);
--> statement-breakpoint
CREATE TABLE "evenements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"nom" varchar(60) NOT NULL,
	"type" varchar(10) NOT NULL,
	"unite_saisie" varchar(15) DEFAULT 'journee' NOT NULL,
	"duree_minutes" integer,
	"est_prioritaire_sur_pointages" boolean DEFAULT false NOT NULL,
	"est_soumis_droits" boolean DEFAULT false NOT NULL,
	"est_visible_planning" boolean DEFAULT true NOT NULL,
	"priorite" integer DEFAULT 0 NOT NULL,
	"code_paie" varchar(20),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evenements_code_valide" CHECK ("evenements"."code" ~ '^[A-Z0-9]{1,3}$'),
	CONSTRAINT "evenements_nom_non_vide" CHECK (char_length(trim("evenements"."nom")) > 0),
	CONSTRAINT "evenements_type_valide" CHECK ("evenements"."type" IN ('absence', 'presence')),
	CONSTRAINT "evenements_priorite_bornee" CHECK ("evenements"."priorite" BETWEEN 0 AND 255),
	CONSTRAINT "evenements_unite_valide" CHECK ("evenements"."unite_saisie" IN ('journee', 'demi_journee', 'heures')),
	CONSTRAINT "evenements_duree_coherente" CHECK (("evenements"."unite_saisie" = 'heures' AND "evenements"."duree_minutes" BETWEEN 1 AND 1440) OR ("evenements"."unite_saisie" <> 'heures' AND "evenements"."duree_minutes" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "evenements_employes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employe_id" uuid NOT NULL,
	"evenement_id" uuid NOT NULL,
	"date_debut" date NOT NULL,
	"date_fin" date NOT NULL,
	"debut_minutes" integer,
	"fin_minutes" integer,
	"remarque" varchar(255),
	"saisi_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evenements_employes_dates_coherentes" CHECK ("evenements_employes"."date_fin" >= "evenements_employes"."date_debut"),
	CONSTRAINT "evenements_employes_heures_valides" CHECK (("evenements_employes"."debut_minutes" IS NULL AND "evenements_employes"."fin_minutes" IS NULL) OR ("evenements_employes"."date_debut" = "evenements_employes"."date_fin" AND "evenements_employes"."debut_minutes" >= 0 AND "evenements_employes"."fin_minutes" <= 1440 AND "evenements_employes"."debut_minutes" < "evenements_employes"."fin_minutes"))
);
--> statement-breakpoint
CREATE TABLE "groupes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(60) NOT NULL,
	"description" varchar(255),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groupes_nom_non_vide" CHECK (char_length(trim("groupes"."nom")) > 0)
);
--> statement-breakpoint
CREATE TABLE "historique" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(20) NOT NULL,
	"objet" varchar(30) NOT NULL,
	"module" varchar(20) NOT NULL,
	"libelle" varchar(150),
	"lien" varchar(200),
	"auteur_id" uuid,
	"auteur_nom" varchar(100) NOT NULL,
	"auteur_identifiant" varchar(50),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "historique_action_valide" CHECK ("historique"."action" IN ('creation', 'modification', 'suppression', 'connexion', 'deconnexion', 'export')),
	CONSTRAINT "historique_module_valide" CHECK ("historique"."module" IN ('personnel', 'planning', 'presence', 'administration'))
);
--> statement-breakpoint
CREATE TABLE "informations_employes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employe_id" uuid NOT NULL,
	"libelle" varchar(60) NOT NULL,
	"valeur" varchar(255) NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "informations_employes_libelle_non_vide" CHECK (char_length(trim("informations_employes"."libelle")) > 0),
	CONSTRAINT "informations_employes_valeur_non_vide" CHECK (char_length(trim("informations_employes"."valeur")) > 0)
);
--> statement-breakpoint
CREATE TABLE "jours_rotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"numero_jour" integer NOT NULL,
	"profil_id" uuid NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jours_rotation_numero_borne" CHECK ("jours_rotation"."numero_jour" BETWEEN 0 AND 30)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" varchar(20) NOT NULL,
	"action" varchar(20) NOT NULL,
	"objet" varchar(30) NOT NULL,
	"libelle" varchar(150),
	"lien" varchar(200),
	"auteur_id" uuid,
	"auteur_nom" varchar(100) NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_module_valide" CHECK ("notifications"."module" IN ('personnel', 'planning', 'presence', 'administration')),
	CONSTRAINT "notifications_action_valide" CHECK ("notifications"."action" IN ('creation', 'modification', 'suppression'))
);
--> statement-breakpoint
CREATE TABLE "parametres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cle" varchar(30) NOT NULL,
	"valeur" varchar(50) NOT NULL,
	"modifie_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parametres_valeur_valide" CHECK (("parametres"."cle" = 'theme' AND "parametres"."valeur" IN ('bleu', 'emeraude', 'ocean', 'ardoise', 'personnalise')) OR ("parametres"."cle" = 'police' AND "parametres"."valeur" IN ('hanken', 'inter', 'source_sans', 'atkinson')) OR ("parametres"."cle" = 'taille_texte' AND "parametres"."valeur" IN ('normale', 'grande', 'tres_grande')) OR ("parametres"."cle" IN ('couleur_primaire', 'couleur_marine', 'couleur_accent', 'couleur_fond') AND "parametres"."valeur" ~ '^#[0-9a-f]{6}$'))
);
--> statement-breakpoint
CREATE TABLE "photos_employes" (
	"employe_id" uuid PRIMARY KEY NOT NULL,
	"type_mime" varchar(20) NOT NULL,
	"contenu" "bytea" NOT NULL,
	"taille_octets" integer NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_employes_type_mime" CHECK ("photos_employes"."type_mime" IN ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT "photos_employes_taille" CHECK ("photos_employes"."taille_octets" BETWEEN 1 AND 524288)
);
--> statement-breakpoint
CREATE TABLE "pieces_jointes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom_fichier" varchar(150) NOT NULL,
	"type_mime" varchar(30) NOT NULL,
	"taille_octets" integer NOT NULL,
	"contenu" "bytea" NOT NULL,
	"ajoute_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pieces_jointes_type_mime" CHECK ("pieces_jointes"."type_mime" IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
	CONSTRAINT "pieces_jointes_taille" CHECK ("pieces_jointes"."taille_octets" BETWEEN 1 AND 2097152),
	CONSTRAINT "pieces_jointes_nom_non_vide" CHECK (char_length(trim("pieces_jointes"."nom_fichier")) > 0)
);
--> statement-breakpoint
CREATE TABLE "plages_profils" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profil_id" uuid NOT NULL,
	"debut_minutes" integer NOT NULL,
	"fin_minutes" integer NOT NULL,
	"type" varchar(15) NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plages_profils_bornes" CHECK ("plages_profils"."debut_minutes" BETWEEN 0 AND 1439 AND "plages_profils"."fin_minutes" BETWEEN 1 AND 1440 AND "plages_profils"."fin_minutes" > "plages_profils"."debut_minutes"),
	CONSTRAINT "plages_profils_type_valide" CHECK ("plages_profils"."type" IN ('interdite', 'neutralisee', 'variable', 'fixe', 'repas', 'retard_tolere'))
);
--> statement-breakpoint
CREATE TABLE "pointages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employe_id" uuid NOT NULL,
	"horodatage" timestamp (3) with time zone NOT NULL,
	"etat" varchar(20) NOT NULL,
	"source" varchar(20) DEFAULT 'manuel' NOT NULL,
	"remarque" varchar(255),
	"saisi_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pointages_etat" CHECK ("pointages"."etat" IN ('entree', 'sortie', 'debut_pause', 'fin_pause', 'debut_heures_sup', 'fin_heures_sup')),
	CONSTRAINT "pointages_source" CHECK ("pointages"."source" IN ('manuel', 'badgeuse'))
);
--> statement-breakpoint
CREATE TABLE "postes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"nom" varchar(100) NOT NULL,
	"ordre" integer DEFAULT 99999 NOT NULL,
	"parent_id" uuid,
	"site_id" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "postes_code_non_vide" CHECK (char_length(trim("postes"."code")) > 0),
	CONSTRAINT "postes_nom_non_vide" CHECK (char_length(trim("postes"."nom")) > 0),
	CONSTRAINT "postes_ordre_borne" CHECK ("postes"."ordre" BETWEEN 0 AND 99999),
	CONSTRAINT "postes_pas_son_propre_parent" CHECK ("postes"."parent_id" IS NULL OR "postes"."parent_id" <> "postes"."id")
);
--> statement-breakpoint
CREATE TABLE "profils_horaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"nom" varchar(60) NOT NULL,
	"type" varchar(10) DEFAULT 'travail' NOT NULL,
	"est_badge" boolean DEFAULT true NOT NULL,
	"repas_minimum_minutes" integer,
	"repas_maximum_minutes" integer,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profils_horaires_code_valide" CHECK ("profils_horaires"."code" ~ '^[A-Z0-9]{1,3}$'),
	CONSTRAINT "profils_horaires_nom_non_vide" CHECK (char_length(trim("profils_horaires"."nom")) > 0),
	CONSTRAINT "profils_horaires_type_valide" CHECK ("profils_horaires"."type" IN ('travail', 'repos')),
	CONSTRAINT "profils_horaires_repas_borne" CHECK (("profils_horaires"."repas_minimum_minutes" IS NULL OR "profils_horaires"."repas_minimum_minutes" BETWEEN 0 AND 720) AND ("profils_horaires"."repas_maximum_minutes" IS NULL OR "profils_horaires"."repas_maximum_minutes" BETWEEN 0 AND 720))
);
--> statement-breakpoint
CREATE TABLE "regles_horaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debut_minutes" integer NOT NULL,
	"fin_minutes" integer NOT NULL,
	"jours_semaine" varchar(7) DEFAULT '1234567' NOT NULL,
	"profil_id" uuid NOT NULL,
	"est_actif" boolean DEFAULT true NOT NULL,
	"couleur" varchar(15) DEFAULT 'bleu' NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regles_horaires_couleur_valide" CHECK ("regles_horaires"."couleur" IN ('bleu', 'vert', 'orange', 'rouge', 'turquoise', 'rose', 'jaune', 'ardoise')),
	CONSTRAINT "regles_horaires_bornes" CHECK ("regles_horaires"."debut_minutes" BETWEEN 0 AND 1439 AND "regles_horaires"."fin_minutes" BETWEEN 1 AND 1440 AND "regles_horaires"."fin_minutes" > "regles_horaires"."debut_minutes"),
	CONSTRAINT "regles_horaires_jours_valides" CHECK ("regles_horaires"."jours_semaine" ~ '^[1-7]{1,7}$')
);
--> statement-breakpoint
CREATE TABLE "rotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(60) NOT NULL,
	"type" varchar(12) NOT NULL,
	"nombre_jours" integer NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rotations_nom_non_vide" CHECK (char_length(trim("rotations"."nom")) > 0),
	CONSTRAINT "rotations_type_et_duree" CHECK (("rotations"."type" = 'hebdomadaire' AND "rotations"."nombre_jours" = 7) OR ("rotations"."type" = 'cycle' AND "rotations"."nombre_jours" BETWEEN 1 AND 31))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" uuid NOT NULL,
	"jeton" varchar(255) NOT NULL,
	"expire_le" timestamp (3) with time zone NOT NULL,
	"adresse_ip" varchar(45),
	"agent_utilisateur" varchar(500),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(100) NOT NULL,
	"adresse" varchar(255),
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_nom_non_vide" CHECK (char_length(trim("sites"."nom")) > 0)
);
--> statement-breakpoint
CREATE TABLE "utilisateurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifiant" varchar(50) NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verifie" boolean DEFAULT false NOT NULL,
	"nom" varchar(100) NOT NULL,
	"image" varchar(500),
	"doit_changer_mot_de_passe" boolean DEFAULT true NOT NULL,
	"est_actif" boolean DEFAULT true NOT NULL,
	"est_super_admin" boolean DEFAULT false NOT NULL,
	"notifications_lues_le" timestamp (3) with time zone,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utilisateurs_email_minuscules" CHECK ("utilisateurs"."email" = lower("utilisateurs"."email")),
	CONSTRAINT "utilisateurs_identifiant_minuscules" CHECK ("utilisateurs"."identifiant" = lower("utilisateurs"."identifiant")),
	CONSTRAINT "utilisateurs_nom_non_vide" CHECK (char_length(trim("utilisateurs"."nom")) > 0)
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifiant" varchar(255) NOT NULL,
	"valeur" varchar(255) NOT NULL,
	"expire_le" timestamp (3) with time zone NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorisations_pages" ADD CONSTRAINT "autorisations_pages_utilisateur_id_utilisateurs_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comptes" ADD CONSTRAINT "comptes_utilisateur_id_utilisateurs_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteurs" ADD CONSTRAINT "compteurs_cree_par_utilisateurs_id_fk" FOREIGN KEY ("cree_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteurs" ADD CONSTRAINT "compteurs_modifie_par_utilisateurs_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteurs_versions" ADD CONSTRAINT "compteurs_versions_compteur_id_compteurs_id_fk" FOREIGN KEY ("compteur_id") REFERENCES "public"."compteurs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteurs_versions" ADD CONSTRAINT "compteurs_versions_modifie_par_utilisateurs_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departements" ADD CONSTRAINT "departements_parent_id_departements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departements" ADD CONSTRAINT "departements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges" ADD CONSTRAINT "droits_conges_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges" ADD CONSTRAINT "droits_conges_evenement_id_evenements_id_fk" FOREIGN KEY ("evenement_id") REFERENCES "public"."evenements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges" ADD CONSTRAINT "droits_conges_saisi_par_utilisateurs_id_fk" FOREIGN KEY ("saisi_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges_pieces_jointes" ADD CONSTRAINT "droits_conges_pieces_jointes_droit_id_droits_conges_id_fk" FOREIGN KEY ("droit_id") REFERENCES "public"."droits_conges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges_pieces_jointes" ADD CONSTRAINT "droits_conges_pj_piece_fk" FOREIGN KEY ("piece_jointe_id") REFERENCES "public"."pieces_jointes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_departement_id_departements_id_fk" FOREIGN KEY ("departement_id") REFERENCES "public"."departements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_poste_id_postes_id_fk" FOREIGN KEY ("poste_id") REFERENCES "public"."postes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_employes" ADD CONSTRAINT "evenements_employes_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_employes" ADD CONSTRAINT "evenements_employes_evenement_id_evenements_id_fk" FOREIGN KEY ("evenement_id") REFERENCES "public"."evenements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_employes" ADD CONSTRAINT "evenements_employes_saisi_par_utilisateurs_id_fk" FOREIGN KEY ("saisi_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historique" ADD CONSTRAINT "historique_auteur_id_utilisateurs_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "informations_employes" ADD CONSTRAINT "informations_employes_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jours_rotation" ADD CONSTRAINT "jours_rotation_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jours_rotation" ADD CONSTRAINT "jours_rotation_profil_id_profils_horaires_id_fk" FOREIGN KEY ("profil_id") REFERENCES "public"."profils_horaires"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_auteur_id_utilisateurs_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametres" ADD CONSTRAINT "parametres_modifie_par_utilisateurs_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos_employes" ADD CONSTRAINT "photos_employes_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces_jointes" ADD CONSTRAINT "pieces_jointes_ajoute_par_utilisateurs_id_fk" FOREIGN KEY ("ajoute_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plages_profils" ADD CONSTRAINT "plages_profils_profil_id_profils_horaires_id_fk" FOREIGN KEY ("profil_id") REFERENCES "public"."profils_horaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_saisi_par_utilisateurs_id_fk" FOREIGN KEY ("saisi_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postes" ADD CONSTRAINT "postes_parent_id_postes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."postes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postes" ADD CONSTRAINT "postes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regles_horaires" ADD CONSTRAINT "regles_horaires_profil_id_profils_horaires_id_fk" FOREIGN KEY ("profil_id") REFERENCES "public"."profils_horaires"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateur_id_utilisateurs_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affectations_rotation_idx" ON "affectations" USING btree ("rotation_id");--> statement-breakpoint
CREATE INDEX "affectations_groupe_idx" ON "affectations" USING btree ("groupe_id","date_debut");--> statement-breakpoint
CREATE INDEX "affectations_employe_idx" ON "affectations" USING btree ("employe_id","date_debut");--> statement-breakpoint
CREATE UNIQUE INDEX "autorisations_pages_utilisateur_page_idx" ON "autorisations_pages" USING btree ("utilisateur_id","page");--> statement-breakpoint
CREATE UNIQUE INDEX "comptes_fournisseur_compte_idx" ON "comptes" USING btree ("fournisseur_id","compte_id");--> statement-breakpoint
CREATE INDEX "comptes_utilisateur_idx" ON "comptes" USING btree ("utilisateur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "compteurs_code_idx" ON "compteurs" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "compteurs_libelle_idx" ON "compteurs" USING btree ("libelle");--> statement-breakpoint
CREATE INDEX "compteurs_cree_par_idx" ON "compteurs" USING btree ("cree_par");--> statement-breakpoint
CREATE INDEX "compteurs_modifie_par_idx" ON "compteurs" USING btree ("modifie_par");--> statement-breakpoint
CREATE UNIQUE INDEX "compteurs_versions_compteur_version_idx" ON "compteurs_versions" USING btree ("compteur_id","version");--> statement-breakpoint
CREATE INDEX "compteurs_versions_modifie_par_idx" ON "compteurs_versions" USING btree ("modifie_par");--> statement-breakpoint
CREATE UNIQUE INDEX "departements_parent_nom_idx" ON "departements" USING btree ("parent_id","nom");--> statement-breakpoint
CREATE INDEX "departements_parent_idx" ON "departements" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "departements_site_idx" ON "departements" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "droits_conges_employe_idx" ON "droits_conges" USING btree ("employe_id","evenement_id","date_debut");--> statement-breakpoint
CREATE INDEX "droits_conges_evenement_idx" ON "droits_conges" USING btree ("evenement_id");--> statement-breakpoint
CREATE INDEX "droits_conges_dates_idx" ON "droits_conges" USING btree ("date_debut","date_fin");--> statement-breakpoint
CREATE INDEX "droits_conges_saisi_par_idx" ON "droits_conges" USING btree ("saisi_par");--> statement-breakpoint
CREATE INDEX "droits_conges_pieces_jointes_piece_idx" ON "droits_conges_pieces_jointes" USING btree ("piece_jointe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employes_matricule_idx" ON "employes" USING btree ("matricule");--> statement-breakpoint
CREATE UNIQUE INDEX "employes_numero_badge_idx" ON "employes" USING btree ("numero_badge");--> statement-breakpoint
CREATE UNIQUE INDEX "employes_piece_identite_idx" ON "employes" USING btree ("type_piece_identite","numero_piece_identite");--> statement-breakpoint
CREATE UNIQUE INDEX "employes_email_idx" ON "employes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employes_departement_idx" ON "employes" USING btree ("departement_id");--> statement-breakpoint
CREATE INDEX "employes_poste_idx" ON "employes" USING btree ("poste_id");--> statement-breakpoint
CREATE INDEX "employes_groupe_idx" ON "employes" USING btree ("groupe_id");--> statement-breakpoint
CREATE INDEX "employes_site_idx" ON "employes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "employes_nom_idx" ON "employes" USING btree ("nom","prenom");--> statement-breakpoint
CREATE UNIQUE INDEX "evenements_code_idx" ON "evenements" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "evenements_nom_idx" ON "evenements" USING btree ("nom");--> statement-breakpoint
CREATE INDEX "evenements_employes_employe_idx" ON "evenements_employes" USING btree ("employe_id","date_debut");--> statement-breakpoint
CREATE INDEX "evenements_employes_evenement_idx" ON "evenements_employes" USING btree ("evenement_id");--> statement-breakpoint
CREATE INDEX "evenements_employes_dates_idx" ON "evenements_employes" USING btree ("date_debut","date_fin");--> statement-breakpoint
CREATE INDEX "evenements_employes_saisi_par_idx" ON "evenements_employes" USING btree ("saisi_par");--> statement-breakpoint
CREATE UNIQUE INDEX "groupes_nom_idx" ON "groupes" USING btree ("nom");--> statement-breakpoint
CREATE INDEX "historique_date_idx" ON "historique" USING btree ("cree_le");--> statement-breakpoint
CREATE INDEX "historique_auteur_date_idx" ON "historique" USING btree ("auteur_id","cree_le");--> statement-breakpoint
CREATE INDEX "historique_module_date_idx" ON "historique" USING btree ("module","cree_le");--> statement-breakpoint
CREATE UNIQUE INDEX "informations_employes_employe_libelle_idx" ON "informations_employes" USING btree ("employe_id","libelle");--> statement-breakpoint
CREATE UNIQUE INDEX "jours_rotation_rotation_jour_idx" ON "jours_rotation" USING btree ("rotation_id","numero_jour");--> statement-breakpoint
CREATE INDEX "jours_rotation_profil_idx" ON "jours_rotation" USING btree ("profil_id");--> statement-breakpoint
CREATE INDEX "notifications_module_date_idx" ON "notifications" USING btree ("module","cree_le");--> statement-breakpoint
CREATE INDEX "notifications_date_idx" ON "notifications" USING btree ("cree_le");--> statement-breakpoint
CREATE INDEX "notifications_auteur_idx" ON "notifications" USING btree ("auteur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parametres_cle_idx" ON "parametres" USING btree ("cle");--> statement-breakpoint
CREATE INDEX "parametres_modifie_par_idx" ON "parametres" USING btree ("modifie_par");--> statement-breakpoint
CREATE INDEX "pieces_jointes_ajoute_par_idx" ON "pieces_jointes" USING btree ("ajoute_par");--> statement-breakpoint
CREATE UNIQUE INDEX "plages_profils_profil_debut_idx" ON "plages_profils" USING btree ("profil_id","debut_minutes");--> statement-breakpoint
CREATE UNIQUE INDEX "pointages_employe_horodatage_etat_idx" ON "pointages" USING btree ("employe_id","horodatage","etat");--> statement-breakpoint
CREATE INDEX "pointages_horodatage_idx" ON "pointages" USING btree ("horodatage");--> statement-breakpoint
CREATE INDEX "pointages_saisi_par_idx" ON "pointages" USING btree ("saisi_par");--> statement-breakpoint
CREATE UNIQUE INDEX "postes_code_idx" ON "postes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "postes_parent_nom_idx" ON "postes" USING btree ("parent_id","nom");--> statement-breakpoint
CREATE INDEX "postes_parent_idx" ON "postes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "postes_site_idx" ON "postes" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profils_horaires_code_idx" ON "profils_horaires" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "profils_horaires_nom_idx" ON "profils_horaires" USING btree ("nom");--> statement-breakpoint
CREATE INDEX "regles_horaires_profil_idx" ON "regles_horaires" USING btree ("profil_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rotations_nom_idx" ON "rotations" USING btree ("nom");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_jeton_idx" ON "sessions" USING btree ("jeton");--> statement-breakpoint
CREATE INDEX "sessions_utilisateur_idx" ON "sessions" USING btree ("utilisateur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_nom_idx" ON "sites" USING btree ("nom");--> statement-breakpoint
CREATE UNIQUE INDEX "utilisateurs_identifiant_idx" ON "utilisateurs" USING btree ("identifiant");--> statement-breakpoint
CREATE UNIQUE INDEX "utilisateurs_email_idx" ON "utilisateurs" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifiant_idx" ON "verifications" USING btree ("identifiant");--> statement-breakpoint
-- Date de modification automatique (remplace « ON UPDATE CURRENT_TIMESTAMP » de MySQL ; Drizzle ne génère pas de déclencheur).
CREATE FUNCTION public.maj_modifie_le() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.modifie_le = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER affectations_modifie_le BEFORE UPDATE ON "affectations" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER autorisations_pages_modifie_le BEFORE UPDATE ON "autorisations_pages" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER comptes_modifie_le BEFORE UPDATE ON "comptes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER compteurs_modifie_le BEFORE UPDATE ON "compteurs" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER compteurs_versions_modifie_le BEFORE UPDATE ON "compteurs_versions" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER departements_modifie_le BEFORE UPDATE ON "departements" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER droits_conges_modifie_le BEFORE UPDATE ON "droits_conges" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER employes_modifie_le BEFORE UPDATE ON "employes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER evenements_modifie_le BEFORE UPDATE ON "evenements" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER evenements_employes_modifie_le BEFORE UPDATE ON "evenements_employes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER groupes_modifie_le BEFORE UPDATE ON "groupes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER historique_modifie_le BEFORE UPDATE ON "historique" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER informations_employes_modifie_le BEFORE UPDATE ON "informations_employes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER jours_rotation_modifie_le BEFORE UPDATE ON "jours_rotation" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER notifications_modifie_le BEFORE UPDATE ON "notifications" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER parametres_modifie_le BEFORE UPDATE ON "parametres" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER photos_employes_modifie_le BEFORE UPDATE ON "photos_employes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER pieces_jointes_modifie_le BEFORE UPDATE ON "pieces_jointes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER plages_profils_modifie_le BEFORE UPDATE ON "plages_profils" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER pointages_modifie_le BEFORE UPDATE ON "pointages" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER postes_modifie_le BEFORE UPDATE ON "postes" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER profils_horaires_modifie_le BEFORE UPDATE ON "profils_horaires" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER regles_horaires_modifie_le BEFORE UPDATE ON "regles_horaires" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER rotations_modifie_le BEFORE UPDATE ON "rotations" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER sessions_modifie_le BEFORE UPDATE ON "sessions" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER sites_modifie_le BEFORE UPDATE ON "sites" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER utilisateurs_modifie_le BEFORE UPDATE ON "utilisateurs" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
CREATE TRIGGER verifications_modifie_le BEFORE UPDATE ON "verifications" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
