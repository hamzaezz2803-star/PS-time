CREATE TABLE "entreprise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"est_unique" boolean DEFAULT true NOT NULL,
	"nom" varchar(150) NOT NULL,
	"adresse" varchar(255),
	"telephone" varchar(20),
	"email" varchar(254),
	"ice" varchar(15),
	"registre_commerce" varchar(40),
	"identifiant_fiscal" varchar(15),
	"numero_cnss" varchar(15),
	"logo_type_mime" varchar(20),
	"logo_contenu" "bytea",
	"logo_taille_octets" integer,
	"logo_modifie_le" timestamp (3) with time zone,
	"modifie_par" uuid,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entreprise_une_seule_ligne" CHECK ("entreprise"."est_unique"),
	CONSTRAINT "entreprise_nom_non_vide" CHECK (char_length(trim("entreprise"."nom")) > 0),
	CONSTRAINT "entreprise_email_minuscules" CHECK ("entreprise"."email" IS NULL OR "entreprise"."email" = lower("entreprise"."email")),
	CONSTRAINT "entreprise_telephone" CHECK ("entreprise"."telephone" IS NULL OR "entreprise"."telephone" ~ '^[+][1-9][0-9]{7,14}$'),
	CONSTRAINT "entreprise_ice" CHECK ("entreprise"."ice" IS NULL OR "entreprise"."ice" ~ '^[0-9]{15}$'),
	CONSTRAINT "entreprise_identifiant_fiscal" CHECK ("entreprise"."identifiant_fiscal" IS NULL OR "entreprise"."identifiant_fiscal" ~ '^[0-9]+$'),
	CONSTRAINT "entreprise_numero_cnss" CHECK ("entreprise"."numero_cnss" IS NULL OR "entreprise"."numero_cnss" ~ '^[0-9]+$'),
	CONSTRAINT "entreprise_logo" CHECK (("entreprise"."logo_type_mime" IS NULL AND "entreprise"."logo_contenu" IS NULL AND "entreprise"."logo_taille_octets" IS NULL AND "entreprise"."logo_modifie_le" IS NULL) OR ("entreprise"."logo_type_mime" IN ('image/jpeg', 'image/png', 'image/webp') AND "entreprise"."logo_contenu" IS NOT NULL AND "entreprise"."logo_modifie_le" IS NOT NULL AND "entreprise"."logo_taille_octets" BETWEEN 1 AND 262144))
);
--> statement-breakpoint
ALTER TABLE "entreprise" ADD CONSTRAINT "entreprise_modifie_par_utilisateurs_id_fk" FOREIGN KEY ("modifie_par") REFERENCES "public"."utilisateurs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entreprise_unique_idx" ON "entreprise" USING btree ("est_unique");--> statement-breakpoint
CREATE INDEX "entreprise_modifie_par_idx" ON "entreprise" USING btree ("modifie_par");--> statement-breakpoint
-- Ajouts à la main (Drizzle ne les écrit pas) : déclencheur de date de modification et clé différable (sauvegarde).
CREATE TRIGGER entreprise_modifie_le BEFORE UPDATE ON "entreprise" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
ALTER TABLE "entreprise" ALTER CONSTRAINT "entreprise_modifie_par_utilisateurs_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
