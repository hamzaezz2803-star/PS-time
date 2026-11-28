-- Pack standard : les formules lisent maintenant les événements (JOURS_<code>, MIN_<code>, DUREE_ABSENCE_MIN,
-- DUREE_EVT_PRESENCE_MIN), les droits aux congés (PRIS_<code>, SOLDE_<code>) et la nuit (DUREE_NUIT_MIN).
-- Les compteurs encore « à adapter » du pack reçoivent leur vraie formule (nouvelle version). Seuls ceux que
-- le client n'a pas touchés (formule « 0 ») changent. Les codes d'événements proposés (CP, RTT, MAL, HSR,
-- REC, HSP) reprennent ceux de Gestor : tant qu'un de ces événements n'existe pas, l'application refuse
-- d'activer le compteur et dit lequel créer. Le compteur libre reste à écrire.
CREATE TEMPORARY TABLE "pack_formules" ("numero_pack" integer PRIMARY KEY, "formule" varchar(2000) NOT NULL, "adaptation" varchar(1000) NOT NULL);--> statement-breakpoint
INSERT INTO "pack_formules" VALUES
(4, 'DUREE_EVT_PRESENCE_MIN', 'Événements de type Présence (formation, mission...) : la durée prévue du jour quand l''événement est retenu en journée entière, plus ceux saisis en heures.'),
(5, 'DUREE_ABSENCE_MIN', 'Événements de type Absence : la durée prévue du jour quand l''événement est retenu en journée entière (un pointage ou une priorité plus forte peut l''écarter), plus les absences saisies en heures.'),
(9, 'DUREE_NUIT_MIN', 'Présence comprise entre 21 h et 6 h (Code du travail, art. 172), de l''entrée à la sortie de la même journée. Une journée qui passe minuit n''est pas encore gérée.'),
(10, 'MIN_HSR - MIN_REC', 'Heures de l''événement HSR (production d''heures à récupérer) moins celles de l''événement REC (récupération), sur le mois. Créez ces deux événements en heures ; changez les codes dans la formule si les vôtres diffèrent. Pas encore de solde cumulé d''un mois à l''autre.'),
(11, 'MIN_HSP', 'Heures de l''événement HSP (production d''heures à payer) sur le mois. Créez cet événement en heures, ou changez le code dans la formule.'),
(12, 'PRIS_CP', 'Repris de Droits aux congés : jours consommés jusqu''à aujourd''hui sur le droit de l''événement CP qui couvre la fin du mois (report et demi-journées compris). Changez le code si votre congé payé en a un autre.'),
(13, 'SOLDE_CP', 'Repris de Droits aux congés : droit utilisable (reliquat, droit, suppléments, report) moins jours pris, pour l''événement CP. Inconnu si l''employé n''a pas de droit sur la période.'),
(14, 'PRIS_RTT', 'Repris de Droits aux congés pour l''événement RTT (soumis à la gestion des droits). Créez-le si l''entreprise en accorde.'),
(15, 'SOLDE_RTT', 'Repris de Droits aux congés : droit utilisable moins pris, pour l''événement RTT.'),
(18, 'JOURS_MAL', 'Jours où l''événement MAL (maladie) est retenu en journée entière, jours de repos exclus. Changez le code dans la formule si votre événement maladie en a un autre.');--> statement-breakpoint
UPDATE "compteurs" c
SET "formule" = p."formule", "adaptation" = p."adaptation", "est_a_adapter" = false, "version" = c."version" + 1
FROM "pack_formules" p
WHERE c."numero_pack" = p."numero_pack" AND c."est_a_adapter" AND c."formule" = '0';--> statement-breakpoint
INSERT INTO "compteurs_versions" ("compteur_id", "version", "formule", "journalier", "hebdomadaire", "mensuel", "unite")
SELECT c."id", c."version", c."formule", c."journalier", c."hebdomadaire", c."mensuel", c."unite"
FROM "compteurs" c
WHERE c."numero_pack" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "compteurs_versions" v WHERE v."compteur_id" = c."id" AND v."version" = c."version");--> statement-breakpoint
DROP TABLE "pack_formules";
