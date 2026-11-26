ALTER TABLE "affectations" DROP CONSTRAINT "affectations_rotation_id_rotations_id_fk";
--> statement-breakpoint
ALTER TABLE "affectations" DROP CONSTRAINT "affectations_groupe_id_groupes_id_fk";
--> statement-breakpoint
ALTER TABLE "affectations" DROP CONSTRAINT "affectations_employe_id_employes_id_fk";
--> statement-breakpoint
ALTER TABLE "compteurs_versions" DROP CONSTRAINT "compteurs_versions_compteur_id_compteurs_id_fk";
--> statement-breakpoint
ALTER TABLE "departements" DROP CONSTRAINT "departements_parent_id_departements_id_fk";
--> statement-breakpoint
ALTER TABLE "departements" DROP CONSTRAINT "departements_site_id_sites_id_fk";
--> statement-breakpoint
ALTER TABLE "droits_conges" DROP CONSTRAINT "droits_conges_evenement_id_evenements_id_fk";
--> statement-breakpoint
ALTER TABLE "employes" DROP CONSTRAINT "employes_departement_id_departements_id_fk";
--> statement-breakpoint
ALTER TABLE "employes" DROP CONSTRAINT "employes_site_id_sites_id_fk";
--> statement-breakpoint
ALTER TABLE "evenements_employes" DROP CONSTRAINT "evenements_employes_evenement_id_evenements_id_fk";
--> statement-breakpoint
ALTER TABLE "jours_rotation" DROP CONSTRAINT "jours_rotation_profil_id_profils_horaires_id_fk";
--> statement-breakpoint
ALTER TABLE "postes" DROP CONSTRAINT "postes_parent_id_postes_id_fk";
--> statement-breakpoint
ALTER TABLE "postes" DROP CONSTRAINT "postes_site_id_sites_id_fk";
--> statement-breakpoint
ALTER TABLE "regles_horaires" DROP CONSTRAINT "regles_horaires_profil_id_profils_horaires_id_fk";
--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_rotation_id_rotations_id_fk" FOREIGN KEY ("rotation_id") REFERENCES "public"."rotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_groupe_id_groupes_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groupes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compteurs_versions" ADD CONSTRAINT "compteurs_versions_compteur_id_compteurs_id_fk" FOREIGN KEY ("compteur_id") REFERENCES "public"."compteurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departements" ADD CONSTRAINT "departements_parent_id_departements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departements" ADD CONSTRAINT "departements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "droits_conges" ADD CONSTRAINT "droits_conges_evenement_id_evenements_id_fk" FOREIGN KEY ("evenement_id") REFERENCES "public"."evenements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_departement_id_departements_id_fk" FOREIGN KEY ("departement_id") REFERENCES "public"."departements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evenements_employes" ADD CONSTRAINT "evenements_employes_evenement_id_evenements_id_fk" FOREIGN KEY ("evenement_id") REFERENCES "public"."evenements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jours_rotation" ADD CONSTRAINT "jours_rotation_profil_id_profils_horaires_id_fk" FOREIGN KEY ("profil_id") REFERENCES "public"."profils_horaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postes" ADD CONSTRAINT "postes_parent_id_postes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."postes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postes" ADD CONSTRAINT "postes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regles_horaires" ADD CONSTRAINT "regles_horaires_profil_id_profils_horaires_id_fk" FOREIGN KEY ("profil_id") REFERENCES "public"."profils_horaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Clés étrangères différables : la restauration d’une sauvegarde remplace toutes les tables dans une transaction (SET CONSTRAINTS ALL DEFERRED), sans ordre imposé et sans superutilisateur. Hors de ce cas, chaque clé reste vérifiée à chaque instruction. Drizzle ne sait pas l’écrire : à refaire si une clé est recréée.
ALTER TABLE "affectations" ALTER CONSTRAINT "affectations_rotation_id_rotations_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "affectations" ALTER CONSTRAINT "affectations_groupe_id_groupes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "affectations" ALTER CONSTRAINT "affectations_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "autorisations_pages" ALTER CONSTRAINT "autorisations_pages_utilisateur_id_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "comptes" ALTER CONSTRAINT "comptes_utilisateur_id_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "compteurs" ALTER CONSTRAINT "compteurs_cree_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "compteurs" ALTER CONSTRAINT "compteurs_modifie_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "compteurs_versions" ALTER CONSTRAINT "compteurs_versions_compteur_id_compteurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "compteurs_versions" ALTER CONSTRAINT "compteurs_versions_modifie_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "departements" ALTER CONSTRAINT "departements_parent_id_departements_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "departements" ALTER CONSTRAINT "departements_site_id_sites_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "droits_conges" ALTER CONSTRAINT "droits_conges_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "droits_conges" ALTER CONSTRAINT "droits_conges_evenement_id_evenements_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "droits_conges" ALTER CONSTRAINT "droits_conges_saisi_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "droits_conges_pieces_jointes" ALTER CONSTRAINT "droits_conges_pieces_jointes_droit_id_droits_conges_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "droits_conges_pieces_jointes" ALTER CONSTRAINT "droits_conges_pj_piece_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "employes" ALTER CONSTRAINT "employes_departement_id_departements_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "employes" ALTER CONSTRAINT "employes_poste_id_postes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "employes" ALTER CONSTRAINT "employes_groupe_id_groupes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "employes" ALTER CONSTRAINT "employes_site_id_sites_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "evenements_employes" ALTER CONSTRAINT "evenements_employes_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "evenements_employes" ALTER CONSTRAINT "evenements_employes_evenement_id_evenements_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "evenements_employes" ALTER CONSTRAINT "evenements_employes_saisi_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "historique" ALTER CONSTRAINT "historique_auteur_id_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "informations_employes" ALTER CONSTRAINT "informations_employes_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "jours_rotation" ALTER CONSTRAINT "jours_rotation_rotation_id_rotations_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "jours_rotation" ALTER CONSTRAINT "jours_rotation_profil_id_profils_horaires_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "notifications" ALTER CONSTRAINT "notifications_auteur_id_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "parametres" ALTER CONSTRAINT "parametres_modifie_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "photos_employes" ALTER CONSTRAINT "photos_employes_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "pieces_jointes" ALTER CONSTRAINT "pieces_jointes_ajoute_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "plages_profils" ALTER CONSTRAINT "plages_profils_profil_id_profils_horaires_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "pointages" ALTER CONSTRAINT "pointages_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "pointages" ALTER CONSTRAINT "pointages_saisi_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "postes" ALTER CONSTRAINT "postes_parent_id_postes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "postes" ALTER CONSTRAINT "postes_site_id_sites_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "regles_horaires" ALTER CONSTRAINT "regles_horaires_profil_id_profils_horaires_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "sessions" ALTER CONSTRAINT "sessions_utilisateur_id_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
