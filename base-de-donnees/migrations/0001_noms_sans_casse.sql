DROP INDEX "compteurs_libelle_idx";--> statement-breakpoint
DROP INDEX "departements_parent_nom_idx";--> statement-breakpoint
DROP INDEX "employes_matricule_idx";--> statement-breakpoint
DROP INDEX "employes_numero_badge_idx";--> statement-breakpoint
DROP INDEX "employes_piece_identite_idx";--> statement-breakpoint
DROP INDEX "evenements_nom_idx";--> statement-breakpoint
DROP INDEX "groupes_nom_idx";--> statement-breakpoint
DROP INDEX "informations_employes_employe_libelle_idx";--> statement-breakpoint
DROP INDEX "postes_code_idx";--> statement-breakpoint
DROP INDEX "postes_parent_nom_idx";--> statement-breakpoint
DROP INDEX "profils_horaires_nom_idx";--> statement-breakpoint
DROP INDEX "rotations_nom_idx";--> statement-breakpoint
DROP INDEX "sites_nom_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "compteurs_libelle_idx" ON "compteurs" USING btree (lower("libelle"));--> statement-breakpoint
CREATE UNIQUE INDEX "departements_parent_nom_idx" ON "departements" USING btree ("parent_id",lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "employes_matricule_idx" ON "employes" USING btree (lower("matricule"));--> statement-breakpoint
CREATE UNIQUE INDEX "employes_numero_badge_idx" ON "employes" USING btree (lower("numero_badge"));--> statement-breakpoint
CREATE UNIQUE INDEX "employes_piece_identite_idx" ON "employes" USING btree ("type_piece_identite",lower("numero_piece_identite"));--> statement-breakpoint
CREATE UNIQUE INDEX "evenements_nom_idx" ON "evenements" USING btree (lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "groupes_nom_idx" ON "groupes" USING btree (lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "informations_employes_employe_libelle_idx" ON "informations_employes" USING btree ("employe_id",lower("libelle"));--> statement-breakpoint
CREATE UNIQUE INDEX "postes_code_idx" ON "postes" USING btree (lower("code"));--> statement-breakpoint
CREATE UNIQUE INDEX "postes_parent_nom_idx" ON "postes" USING btree ("parent_id",lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "profils_horaires_nom_idx" ON "profils_horaires" USING btree (lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "rotations_nom_idx" ON "rotations" USING btree (lower("nom"));--> statement-breakpoint
CREATE UNIQUE INDEX "sites_nom_idx" ON "sites" USING btree (lower("nom"));