-- Pointage à distance : droits en plus de la présence (mission, heures sup.) et états Début/Fin de mission.
-- Employés déjà autorisés : présence seule (les deux droits à faux), à cocher sur leur fiche au besoin.
ALTER TABLE "employes" DROP CONSTRAINT "employes_distance_coherente";--> statement-breakpoint
ALTER TABLE "pointages" DROP CONSTRAINT "pointages_etat";--> statement-breakpoint
ALTER TABLE "employes" ADD COLUMN "distance_droit_mission" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employes" ADD COLUMN "distance_droit_heures_sup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employes" ADD CONSTRAINT "employes_distance_coherente" CHECK ("employes"."pointage_distance" OR ("employes"."appareils_distance" = '' AND NOT "employes"."distance_exige_position" AND NOT "employes"."distance_exige_photo" AND NOT "employes"."distance_droit_mission" AND NOT "employes"."distance_droit_heures_sup"));--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_etat" CHECK ("pointages"."etat" IN ('entree', 'sortie', 'debut_pause', 'fin_pause', 'debut_mission', 'fin_mission', 'debut_heures_sup', 'fin_heures_sup'));