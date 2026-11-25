CREATE TABLE "photos_pointages" (
	"pointage_id" uuid PRIMARY KEY NOT NULL,
	"type_mime" varchar(20) NOT NULL,
	"contenu" "bytea" NOT NULL,
	"taille_octets" integer NOT NULL,
	"cree_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_pointages_type_mime" CHECK ("photos_pointages"."type_mime" = 'image/jpeg'),
	CONSTRAINT "photos_pointages_taille" CHECK ("photos_pointages"."taille_octets" BETWEEN 1 AND 204800)
);
--> statement-breakpoint
ALTER TABLE "pointages" DROP CONSTRAINT "pointages_source";--> statement-breakpoint
ALTER TABLE "pointages" ADD COLUMN "appareil" varchar(10);--> statement-breakpoint
ALTER TABLE "pointages" ADD COLUMN "latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "pointages" ADD COLUMN "longitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "pointages" ADD COLUMN "precision_metres" integer;--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD COLUMN "employe_id" uuid;--> statement-breakpoint
ALTER TABLE "photos_pointages" ADD CONSTRAINT "photos_pointages_pointage_id_pointages_id_fk" FOREIGN KEY ("pointage_id") REFERENCES "public"."pointages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_pointages_cree_le_idx" ON "photos_pointages" USING btree ("cree_le");--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_employe_id_employes_id_fk" FOREIGN KEY ("employe_id") REFERENCES "public"."employes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "utilisateurs_employe_idx" ON "utilisateurs" USING btree ("employe_id");--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_appareil" CHECK ("pointages"."appareil" IS NULL OR "pointages"."appareil" IN ('pc', 'tablette', 'telephone'));--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_position" CHECK (("pointages"."latitude" IS NULL AND "pointages"."longitude" IS NULL AND "pointages"."precision_metres" IS NULL) OR ("pointages"."latitude" BETWEEN -90 AND 90 AND "pointages"."longitude" BETWEEN -180 AND 180 AND "pointages"."precision_metres" BETWEEN 0 AND 100000));--> statement-breakpoint
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_source" CHECK ("pointages"."source" IN ('manuel', 'badgeuse', 'distance'));--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_employe_sans_super_admin" CHECK ("utilisateurs"."employe_id" IS NULL OR NOT "utilisateurs"."est_super_admin");--> statement-breakpoint
-- Ajouts à la main (Drizzle ne les écrit pas) : déclencheur de date de modification et clés différables (sauvegarde).
CREATE TRIGGER photos_pointages_modifie_le BEFORE UPDATE ON "photos_pointages" FOR EACH ROW EXECUTE FUNCTION public.maj_modifie_le();
--> statement-breakpoint
ALTER TABLE "photos_pointages" ALTER CONSTRAINT "photos_pointages_pointage_id_pointages_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER CONSTRAINT "utilisateurs_employe_id_employes_id_fk" DEFERRABLE INITIALLY IMMEDIATE;
