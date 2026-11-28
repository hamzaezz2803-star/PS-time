ALTER TABLE "compteurs" ADD COLUMN "numero_pack" integer;--> statement-breakpoint
ALTER TABLE "compteurs" ADD COLUMN "famille" varchar(15);--> statement-breakpoint
ALTER TABLE "compteurs" ADD COLUMN "fonctionnement" varchar(2000);--> statement-breakpoint
ALTER TABLE "compteurs" ADD COLUMN "adaptation" varchar(1000);--> statement-breakpoint
ALTER TABLE "compteurs" ADD COLUMN "remise_a_zero" varchar(300);--> statement-breakpoint
ALTER TABLE "compteurs" ADD COLUMN "est_a_adapter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "compteurs_numero_pack_idx" ON "compteurs" USING btree ("numero_pack");--> statement-breakpoint
ALTER TABLE "compteurs" ADD CONSTRAINT "compteurs_numero_pack_valide" CHECK ("compteurs"."numero_pack" IS NULL OR "compteurs"."numero_pack" BETWEEN 1 AND 99);--> statement-breakpoint
ALTER TABLE "compteurs" ADD CONSTRAINT "compteurs_famille_valide" CHECK ("compteurs"."famille" IS NULL OR "compteurs"."famille" IN ('presence', 'absences', 'heures_sup', 'conges', 'autres'));--> statement-breakpoint
ALTER TABLE "compteurs" ADD CONSTRAINT "compteurs_a_adapter_inactif" CHECK (NOT ("compteurs"."est_a_adapter" AND "compteurs"."est_actif"));