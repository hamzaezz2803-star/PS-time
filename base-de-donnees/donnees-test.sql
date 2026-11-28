-- Données de test FICTIVES pour remplir l'application en développement.
-- PostgreSQL : à exécuter dans DBeaver (Alt+X) ou avec psql, connecté en propriétaire des tables.
-- Noms inventés, téléphones factices (+2126000000xx), e-mails en @exemple.test (domaine réservé aux tests).
-- Aucune pièce d'identité. Ne jamais exécuter chez un client.
--
-- Rejouable : les données de test déjà présentes sont d'abord supprimées.
-- Pour seulement les retirer : base-de-donnees/supprimer-donnees-test.sql.
-- Tous les identifiants commencent par 00000000-0000-4000-8000- (repérables et supprimables).

BEGIN;

-- 1. Retrait des données de test précédentes (enfants avant parents).
-- Compteurs de test et leurs versions (avant les comptes et profils).
DELETE FROM compteurs_versions WHERE compteur_id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM compteurs WHERE id::text LIKE '00000000-0000-4000-8000-%';
-- Absences de test, et celles saisies dans l'application pour un employé ou un événement de test.
DELETE FROM evenements_employes WHERE id::text LIKE '00000000-0000-4000-8000-%' OR employe_id::text LIKE '00000000-0000-4000-8000-%' OR evenement_id::text LIKE '00000000-0000-4000-8000-%';
-- Droits aux congés de test, et ceux saisis dans l'application pour un employé ou un événement de test.
DELETE FROM droits_conges WHERE id::text LIKE '00000000-0000-4000-8000-%' OR employe_id::text LIKE '00000000-0000-4000-8000-%' OR evenement_id::text LIKE '00000000-0000-4000-8000-%';
-- Événements de test.
DELETE FROM evenements WHERE id::text LIKE '00000000-0000-4000-8000-%';
-- Règles d'horaire dynamique de test, et celles saisies dans l'application sur un profil de test.
DELETE FROM regles_horaires WHERE id::text LIKE '00000000-0000-4000-8000-%' OR profil_id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM affectations WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM employes WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM groupes WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM rotations WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM profils_horaires WHERE id::text LIKE '00000000-0000-4000-8000-%';
-- Parents et enfants supprimés dans la même instruction : la clé de l'arbre est vérifiée à la fin.
DELETE FROM departements WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM postes WHERE id::text LIKE '00000000-0000-4000-8000-%';
DELETE FROM sites WHERE id::text LIKE '00000000-0000-4000-8000-%';

-- 1 bis. Sites (adresses inventées). Rattachés aux départements, postes et employés en fin de fichier.
INSERT INTO sites (id, nom, adresse) VALUES
  ('00000000-0000-4000-8000-000000000901', 'Siège', '1 rue Fictive, Casablanca'),
  ('00000000-0000-4000-8000-000000000902', 'Usine', 'Zone industrielle fictive, Kénitra');

-- 2. Départements (arbre).
INSERT INTO departements (id, nom, parent_id) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Direction', NULL),
  ('00000000-0000-4000-8000-000000000102', 'Production', NULL),
  ('00000000-0000-4000-8000-000000000103', 'Atelier A', '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000104', 'Atelier B', '00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000105', 'Logistique', NULL),
  ('00000000-0000-4000-8000-000000000106', 'Administration', NULL),
  ('00000000-0000-4000-8000-000000000107', 'Ressources humaines', '00000000-0000-4000-8000-000000000106'),
  ('00000000-0000-4000-8000-000000000108', 'Comptabilité', '00000000-0000-4000-8000-000000000106');

-- 3. Postes (arbre).
INSERT INTO postes (id, code, nom, ordre, parent_id) VALUES
  ('00000000-0000-4000-8000-000000000201', 'P01', 'Directeur', 1, NULL),
  ('00000000-0000-4000-8000-000000000202', 'P02', 'Chef d''atelier', 2, '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000203', 'P03', 'Opérateur', 3, '00000000-0000-4000-8000-000000000202'),
  ('00000000-0000-4000-8000-000000000204', 'P04', 'Magasinier', 4, '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000205', 'P05', 'Agent administratif', 5, '00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000206', 'P06', 'Comptable', 6, '00000000-0000-4000-8000-000000000205');

-- 4. Profils horaires : la journée de 00:00 à 24:00 découpée en plages (minutes depuis minuit : 480 = 08:00).
--    Théorique = somme des plages fixes. J8 reprend le schéma du responsable (8 h).
INSERT INTO profils_horaires (id, code, nom, type, est_badge, repas_minimum_minutes, repas_maximum_minutes) VALUES
  ('00000000-0000-4000-8000-000000000401', 'J8', 'Journée de 8 h', 'travail', true, 45, 120),
  ('00000000-0000-4000-8000-000000000402', 'MAT', 'Matin', 'travail', true, 20, 30),
  ('00000000-0000-4000-8000-000000000403', 'APM', 'Après-midi', 'travail', true, 20, 30),
  ('00000000-0000-4000-8000-000000000404', 'BUR', 'Bureau', 'travail', true, 45, 60),
  ('00000000-0000-4000-8000-000000000405', 'SAM', 'Samedi matin', 'travail', false, NULL, NULL),
  ('00000000-0000-4000-8000-000000000406', 'REP', 'Repos', 'repos', false, NULL, NULL);

INSERT INTO plages_profils (id, profil_id, debut_minutes, fin_minutes, type) VALUES
  -- J8 : 00-07 interdite, 07-08 variable, 08-12 fixe, 12-14 repas, 14-18 fixe, 18-19 variable, 19-24 interdite.
  ('00000000-0000-4000-8000-000000001401', '00000000-0000-4000-8000-000000000401', 0, 420, 'interdite'),
  ('00000000-0000-4000-8000-000000001402', '00000000-0000-4000-8000-000000000401', 420, 480, 'variable'),
  ('00000000-0000-4000-8000-000000001403', '00000000-0000-4000-8000-000000000401', 480, 720, 'fixe'),
  ('00000000-0000-4000-8000-000000001404', '00000000-0000-4000-8000-000000000401', 720, 840, 'repas'),
  ('00000000-0000-4000-8000-000000001405', '00000000-0000-4000-8000-000000000401', 840, 1080, 'fixe'),
  ('00000000-0000-4000-8000-000000001406', '00000000-0000-4000-8000-000000000401', 1080, 1140, 'variable'),
  ('00000000-0000-4000-8000-000000001407', '00000000-0000-4000-8000-000000000401', 1140, 1440, 'interdite'),
  -- MAT : 05:30-06:00 variable, 06:00-10:00 fixe, 10:00-10:30 repas, 10:30-14:00 fixe, 14:00-14:30 variable.
  ('00000000-0000-4000-8000-000000001411', '00000000-0000-4000-8000-000000000402', 0, 330, 'interdite'),
  ('00000000-0000-4000-8000-000000001412', '00000000-0000-4000-8000-000000000402', 330, 360, 'variable'),
  ('00000000-0000-4000-8000-000000001413', '00000000-0000-4000-8000-000000000402', 360, 600, 'fixe'),
  ('00000000-0000-4000-8000-000000001414', '00000000-0000-4000-8000-000000000402', 600, 630, 'repas'),
  ('00000000-0000-4000-8000-000000001415', '00000000-0000-4000-8000-000000000402', 630, 840, 'fixe'),
  ('00000000-0000-4000-8000-000000001416', '00000000-0000-4000-8000-000000000402', 840, 870, 'variable'),
  ('00000000-0000-4000-8000-000000001417', '00000000-0000-4000-8000-000000000402', 870, 1440, 'interdite'),
  -- APM : 13:30-14:00 variable, 14:00-18:00 fixe, 18:00-18:30 repas, 18:30-22:00 fixe, 22:00-22:30 variable.
  ('00000000-0000-4000-8000-000000001421', '00000000-0000-4000-8000-000000000403', 0, 810, 'interdite'),
  ('00000000-0000-4000-8000-000000001422', '00000000-0000-4000-8000-000000000403', 810, 840, 'variable'),
  ('00000000-0000-4000-8000-000000001423', '00000000-0000-4000-8000-000000000403', 840, 1080, 'fixe'),
  ('00000000-0000-4000-8000-000000001424', '00000000-0000-4000-8000-000000000403', 1080, 1110, 'repas'),
  ('00000000-0000-4000-8000-000000001425', '00000000-0000-4000-8000-000000000403', 1110, 1320, 'fixe'),
  ('00000000-0000-4000-8000-000000001426', '00000000-0000-4000-8000-000000000403', 1320, 1350, 'variable'),
  ('00000000-0000-4000-8000-000000001427', '00000000-0000-4000-8000-000000000403', 1350, 1440, 'interdite'),
  -- BUR : 07:30-08:25 variable, 08:25-08:30 retard toléré, 08:30-12:30 fixe, 12:30-13:30 repas, 13:30-17:30 fixe, 17:30-19:00 neutralisée.
  ('00000000-0000-4000-8000-000000001431', '00000000-0000-4000-8000-000000000404', 0, 450, 'interdite'),
  ('00000000-0000-4000-8000-000000001432', '00000000-0000-4000-8000-000000000404', 450, 505, 'variable'),
  ('00000000-0000-4000-8000-000000001433', '00000000-0000-4000-8000-000000000404', 505, 510, 'retard_tolere'),
  ('00000000-0000-4000-8000-000000001434', '00000000-0000-4000-8000-000000000404', 510, 750, 'fixe'),
  ('00000000-0000-4000-8000-000000001435', '00000000-0000-4000-8000-000000000404', 750, 810, 'repas'),
  ('00000000-0000-4000-8000-000000001436', '00000000-0000-4000-8000-000000000404', 810, 1050, 'fixe'),
  ('00000000-0000-4000-8000-000000001437', '00000000-0000-4000-8000-000000000404', 1050, 1140, 'neutralisee'),
  ('00000000-0000-4000-8000-000000001438', '00000000-0000-4000-8000-000000000404', 1140, 1440, 'interdite'),
  -- SAM (non badgé) : 08:00-12:00 fixe.
  ('00000000-0000-4000-8000-000000001441', '00000000-0000-4000-8000-000000000405', 0, 480, 'interdite'),
  ('00000000-0000-4000-8000-000000001442', '00000000-0000-4000-8000-000000000405', 480, 720, 'fixe'),
  ('00000000-0000-4000-8000-000000001443', '00000000-0000-4000-8000-000000000405', 720, 1440, 'interdite');

-- 5. Rotations et profil horaire de chaque jour (jour absent = repos).
INSERT INTO rotations (id, nom, type, nombre_jours) VALUES
  ('00000000-0000-4000-8000-000000000501', 'Semaine bureau', 'hebdomadaire', 7),
  ('00000000-0000-4000-8000-000000000502', '2 × 8 (cycle de 6 jours)', 'cycle', 6),
  ('00000000-0000-4000-8000-000000000503', 'Semaine du matin', 'hebdomadaire', 7),
  ('00000000-0000-4000-8000-000000000504', 'Matin du lundi au vendredi', 'hebdomadaire', 7);

INSERT INTO jours_rotation (id, rotation_id, numero_jour, profil_id) VALUES
  -- Semaine bureau : lundi à vendredi Bureau, samedi matin, dimanche Repos.
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000501', 0, '00000000-0000-4000-8000-000000000404'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000501', 1, '00000000-0000-4000-8000-000000000404'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000501', 2, '00000000-0000-4000-8000-000000000404'),
  ('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000501', 3, '00000000-0000-4000-8000-000000000404'),
  ('00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000501', 4, '00000000-0000-4000-8000-000000000404'),
  ('00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000501', 5, '00000000-0000-4000-8000-000000000405'),
  ('00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000501', 6, '00000000-0000-4000-8000-000000000406'),
  -- 2 × 8 : 2 jours matin, 2 après-midi, 2 repos.
  ('00000000-0000-4000-8000-000000000611', '00000000-0000-4000-8000-000000000502', 0, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000612', '00000000-0000-4000-8000-000000000502', 1, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000613', '00000000-0000-4000-8000-000000000502', 2, '00000000-0000-4000-8000-000000000403'),
  ('00000000-0000-4000-8000-000000000614', '00000000-0000-4000-8000-000000000502', 3, '00000000-0000-4000-8000-000000000403'),
  -- Semaine du matin : lundi à samedi Journée de 8 h.
  ('00000000-0000-4000-8000-000000000621', '00000000-0000-4000-8000-000000000503', 0, '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000622', '00000000-0000-4000-8000-000000000503', 1, '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000623', '00000000-0000-4000-8000-000000000503', 2, '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000624', '00000000-0000-4000-8000-000000000503', 3, '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000625', '00000000-0000-4000-8000-000000000503', 4, '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000626', '00000000-0000-4000-8000-000000000503', 5, '00000000-0000-4000-8000-000000000401'),
  -- Matin du lundi au vendredi : horaire de secours des employés en horaire dynamique (premier
  -- pointage non reconnu par une règle), repos le week-end.
  ('00000000-0000-4000-8000-000000000631', '00000000-0000-4000-8000-000000000504', 0, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000632', '00000000-0000-4000-8000-000000000504', 1, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000633', '00000000-0000-4000-8000-000000000504', 2, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000634', '00000000-0000-4000-8000-000000000504', 3, '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000635', '00000000-0000-4000-8000-000000000504', 4, '00000000-0000-4000-8000-000000000402');

-- 6. Groupes.
INSERT INTO groupes (id, nom, description) VALUES
  ('00000000-0000-4000-8000-000000000701', 'Équipe A', 'Atelier A, en 2 × 8'),
  ('00000000-0000-4000-8000-000000000702', 'Équipe B', 'Atelier B, en 2 × 8 décalé de 2 jours'),
  ('00000000-0000-4000-8000-000000000703', 'Équipe C', 'Logistique, en 2 × 8 décalé de 4 jours'),
  ('00000000-0000-4000-8000-000000000704', 'Bureaux', 'Direction et administration');

-- 7. Employés (16, fictifs).
INSERT INTO employes (id, matricule, numero_badge, prenom, nom, departement_id, poste_id, genre, telephone, email, type_emploi, date_embauche, date_debut_emploi, date_fin_emploi, groupe_id) VALUES
  ('00000000-0000-4000-8000-000000000301', 'T001', 'B1001', 'Karim', 'Benali', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'homme', '+212600000001', 'karim.benali@exemple.test', 'cdi', '2021-03-01', '2021-03-01', NULL, '00000000-0000-4000-8000-000000000704'),
  ('00000000-0000-4000-8000-000000000302', 'T002', 'B1002', 'Salma', 'Idrissi', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000202', 'femme', '+212600000002', 'salma.idrissi@exemple.test', 'cdi', '2022-01-10', '2022-01-10', NULL, '00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000303', 'T003', 'B1003', 'Youssef', 'Amrani', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'homme', '+212600000003', 'youssef.amrani@exemple.test', 'cdi', '2023-02-01', '2023-02-01', NULL, '00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000304', 'T004', 'B1004', 'Nadia', 'Tazi', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'femme', NULL, NULL, 'cdd', '2025-06-01', '2025-06-01', '2026-12-31', '00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000305', 'T005', 'B1005', 'Omar', 'Chraibi', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'homme', '+212600000005', NULL, 'interim', '2026-09-01', '2026-09-01', '2027-02-28', '00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000306', 'T006', 'B1006', 'Hicham', 'Lahlou', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000202', 'homme', '+212600000006', 'hicham.lahlou@exemple.test', 'cdi', '2020-09-15', '2020-09-15', NULL, '00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000000307', 'T007', 'B1007', 'Imane', 'Berrada', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000203', 'femme', NULL, NULL, 'cdi', '2023-05-02', '2023-05-02', NULL, '00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000000308', 'T008', 'B1008', 'Mehdi', 'Ouazzani', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000203', 'homme', '+212600000008', NULL, 'cdd', '2025-01-06', '2025-01-06', '2026-12-31', '00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000000309', 'T009', 'B1009', 'Leila', 'Sefrioui', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000203', 'femme', NULL, NULL, 'stage', '2026-10-01', '2026-10-01', '2027-03-31', '00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000000310', 'T010', 'B1010', 'Rachid', 'El Fassi', '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000204', 'homme', '+212600000010', 'rachid.elfassi@exemple.test', 'cdi', '2019-11-04', '2019-11-04', NULL, '00000000-0000-4000-8000-000000000703'),
  ('00000000-0000-4000-8000-000000000311', 'T011', 'B1011', 'Hamid', 'Bouzid', '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000204', 'homme', NULL, NULL, 'cdi', '2024-04-01', '2024-04-01', NULL, '00000000-0000-4000-8000-000000000703'),
  ('00000000-0000-4000-8000-000000000312', 'T012', 'B1012', 'Sanaa', 'Kettani', '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000204', 'femme', '+212600000012', NULL, 'interim', '2026-08-17', '2026-08-17', '2027-01-31', NULL),
  ('00000000-0000-4000-8000-000000000313', 'T013', 'B1013', 'Zineb', 'Alaoui', '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000205', 'femme', '+212600000013', 'zineb.alaoui@exemple.test', 'cdi', '2022-07-01', '2022-07-01', NULL, '00000000-0000-4000-8000-000000000704'),
  ('00000000-0000-4000-8000-000000000314', 'T014', 'B1014', 'Anas', 'Mansouri', '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000205', 'homme', NULL, 'anas.mansouri@exemple.test', 'cdd', '2025-09-01', '2025-09-01', '2027-08-31', '00000000-0000-4000-8000-000000000704'),
  ('00000000-0000-4000-8000-000000000315', 'T015', 'B1015', 'Fatima', 'Zahraoui', '00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000206', 'femme', '+212600000015', 'fatima.zahraoui@exemple.test', 'cdi', '2018-02-12', '2018-02-12', NULL, '00000000-0000-4000-8000-000000000704'),
  ('00000000-0000-4000-8000-000000000316', 'T016', 'B1016', 'Adil', 'Naciri', '00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000206', 'homme', NULL, NULL, 'stage', '2026-11-02', '2026-11-02', '2027-01-29', NULL);

-- 8. Affectations : les équipes en 2 × 8 démarrent à 2 jours d'écart pour se relayer.
-- Début en janvier : les 30 derniers jours ont tous un horaire.
-- Sanaa Kettani (T012) n'a ni groupe ni affectation : cas « aucun horaire » alors qu'elle pointe.
INSERT INTO affectations (id, rotation_id, groupe_id, employe_id, date_debut, date_fin) VALUES
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000704', NULL, '2026-01-05', NULL),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000701', NULL, '2026-01-05', NULL),
  ('00000000-0000-4000-8000-000000000803', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000702', NULL, '2026-01-07', NULL),
  ('00000000-0000-4000-8000-000000000804', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000703', NULL, '2026-01-09', NULL),
  -- Stagiaire sans groupe : affectation individuelle limitée à son stage.
  ('00000000-0000-4000-8000-000000000805', '00000000-0000-4000-8000-000000000503', NULL, '00000000-0000-4000-8000-000000000316', '2026-11-02', '2027-01-29'),
  -- Employés en horaire dynamique (Équipe A) : leur affectation individuelle passe avant celle du groupe.
  ('00000000-0000-4000-8000-000000000806', '00000000-0000-4000-8000-000000000504', NULL, '00000000-0000-4000-8000-000000000302', '2026-01-05', NULL),
  ('00000000-0000-4000-8000-000000000807', '00000000-0000-4000-8000-000000000504', NULL, '00000000-0000-4000-8000-000000000303', '2026-01-05', NULL),
  ('00000000-0000-4000-8000-000000000808', '00000000-0000-4000-8000-000000000504', NULL, '00000000-0000-4000-8000-000000000304', '2026-01-05', NULL);

-- 9. Sites : Production et Logistique à l'Usine, Direction et Administration au Siège.
UPDATE departements SET site_id = '00000000-0000-4000-8000-000000000902'
  WHERE id IN ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000105');
UPDATE departements SET site_id = '00000000-0000-4000-8000-000000000901'
  WHERE id IN ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000108');
UPDATE postes SET site_id = '00000000-0000-4000-8000-000000000902'
  WHERE id IN ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000204');
UPDATE postes SET site_id = '00000000-0000-4000-8000-000000000901'
  WHERE id IN ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000206');
-- Chaque employé de test prend le site de son département.
UPDATE employes e SET site_id = d.site_id
  FROM departements d
  WHERE d.id = e.departement_id AND e.id::text LIKE '00000000-0000-4000-8000-%';

-- 9 bis. Pointage à distance et doigts à enrôler (jamais d'empreinte) : Hamid Bouzid (T011), souvent en
-- mission, peut pointer depuis son téléphone ou une tablette, position et photo exigées, avec le droit
-- « P. Mission » en plus de la présence ; Karim Benali (T001) depuis son PC, présence seule. Doigts
-- prévus : index droit et index gauche pour T001, pouces pour T011.
UPDATE employes SET pointage_distance = true, appareils_distance = 'tablette,telephone', distance_exige_position = true, distance_exige_photo = true, distance_droit_mission = true, doigts_a_enroler = '45'
  WHERE id = '00000000-0000-4000-8000-000000000311';
UPDATE employes SET pointage_distance = true, appareils_distance = 'pc', doigts_a_enroler = '36'
  WHERE id = '00000000-0000-4000-8000-000000000301';

-- 10. Horaire dynamique : premier pointage du matin → Matin, de l'après-midi → Après-midi (lundi à vendredi).
-- Une couleur par règle : Matin en orange, Après-midi en bleu (pastilles du rapport des présences).
INSERT INTO regles_horaires (id, debut_minutes, fin_minutes, jours_semaine, profil_id, est_actif, couleur) VALUES
  ('00000000-0000-4000-8000-000000000501', 300, 480, '12345', '00000000-0000-4000-8000-000000000402', true, 'orange'),
  ('00000000-0000-4000-8000-000000000502', 720, 900, '12345', '00000000-0000-4000-8000-000000000403', true, 'bleu');
-- Employés en horaire dynamique : Salma Idrissi (T002, après-midi), Youssef Amrani (T003, matin),
-- Nadia Tazi (T004, un jour le matin, un jour l'après-midi). Les autres gardent leur rotation.
UPDATE employes SET horaire_dynamique = true
  WHERE id IN ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000304');

-- 11. Compteurs (formules d'exemple) et leur première version. Un compteur inactif pour le filtre.
INSERT INTO compteurs (id, code, libelle, formule, journalier, hebdomadaire, mensuel, unite, description, est_actif) VALUES
  ('00000000-0000-4000-8000-000000001601', 'RETARD', 'Retard', 'RETARD_MIN', true, true, true, 'minutes', 'Minutes de retard à l''arrivée.', true),
  ('00000000-0000-4000-8000-000000001602', 'TEMPS_TRAVAILLE', 'Temps travaillé', 'DUREE_TRAVAILLEE_MIN', true, true, true, 'minutes', 'Du premier au dernier pointage.', true),
  ('00000000-0000-4000-8000-000000001603', 'HEURES_SUP', 'Heures supplémentaires', 'IF(DEPASSEMENT_MIN > 15, DEPASSEMENT_MIN, 0)', true, true, true, 'minutes', 'Dépassement compté au-delà de 15 minutes.', true),
  ('00000000-0000-4000-8000-000000001604', 'ABSENCES', 'Absences', 'NB_ABSENCES', false, true, true, 'jours', 'Jours planifiés sans pointage.', true),
  ('00000000-0000-4000-8000-000000001605', 'TAUX_PRESENCE', 'Taux de présence', 'ROUND(NB_JOURS_TRAVAILLES / NB_JOURS_PLANIFIES * 100, 1)', false, true, true, 'pourcentage', 'Jours travaillés sur jours planifiés.', true),
  ('00000000-0000-4000-8000-000000001606', 'JOURS_INCOMPLETS', 'Jours incomplets', 'NB_JOURS_INCOMPLETS', false, true, true, 'jours', 'Présent sans sortie pointée.', true),
  ('00000000-0000-4000-8000-000000001607', 'RETARDS_5MIN', 'Retards de plus de 5 min', 'IF(COALESCE(RETARD_MIN, 0) > 5, 1, 0)', true, false, false, 'nombre', NULL, true),
  ('00000000-0000-4000-8000-000000001608', 'RETARD_HEURES', 'Retard en heures', 'ROUND(RETARD_MIN / 60, 2)', true, false, false, 'heures', 'Exemple de compteur désactivé.', false);

INSERT INTO compteurs_versions (id, compteur_id, version, formule, journalier, hebdomadaire, mensuel, unite)
SELECT ('00000000-0000-4000-8000-0000000017' || right(id::text, 2))::uuid, id, 1, formule, journalier, hebdomadaire, mensuel, unite
FROM compteurs WHERE id::text LIKE '00000000-0000-4000-8000-%';


-- 12. Événements : motifs d'absence et de présence courants, à la journée, à la demi-journée ou en heures.
-- La récupération est non active. Congés payés, reportés et récupération sont soumis à la gestion des droits.
INSERT INTO evenements (id, code, nom, type, unite_saisie, duree_minutes, est_prioritaire_sur_pointages, est_visible_planning, priorite, code_paie, est_soumis_droits) VALUES
  ('00000000-0000-4000-8000-000000001801', 'CP', 'Congé payé', 'absence', 'journee', NULL, false, true, 10, 'CP', true),
  ('00000000-0000-4000-8000-000000001802', 'CPR', 'Congés reportés', 'absence', 'journee', NULL, false, true, 10, 'CP-REP', true),
  ('00000000-0000-4000-8000-000000001803', 'MAL', 'Maladie', 'absence', 'journee', NULL, false, true, 50, 'MAL', false),
  ('00000000-0000-4000-8000-000000001804', 'AT', 'Accident du travail', 'absence', 'journee', NULL, false, true, 60, 'AT', false),
  ('00000000-0000-4000-8000-000000001805', 'MAT', 'Congé de maternité', 'absence', 'journee', NULL, false, true, 70, 'MAT', false),
  ('00000000-0000-4000-8000-000000001806', 'PAT', 'Congé de paternité', 'absence', 'journee', NULL, false, true, 40, 'PAT', false),
  ('00000000-0000-4000-8000-000000001807', 'CSS', 'Congé sans solde', 'absence', 'demi_journee', NULL, false, true, 10, 'CSS', false),
  ('00000000-0000-4000-8000-000000001808', 'ABA', 'Absence autorisée', 'absence', 'heures', 120, false, true, 20, NULL, false),
  ('00000000-0000-4000-8000-000000001809', 'FOR', 'Formation', 'presence', 'heures', 120, true, true, 30, 'FOR', false),
  ('00000000-0000-4000-8000-000000001810', 'MIS', 'Mission', 'presence', 'journee', NULL, true, true, 30, 'MIS', false),
  ('00000000-0000-4000-8000-000000001811', 'RCP', 'Récupération', 'absence', 'heures', 120, false, false, 15, NULL, true),
  -- Codes repris par les formules du pack standard (Gestor) : heures sup. à récupérer (HSR, REC), à payer (HSP), RTT.
  ('00000000-0000-4000-8000-000000001812', 'HSR', 'Heures sup. à récupérer', 'presence', 'heures', 60, false, true, 25, 'HSR', false),
  ('00000000-0000-4000-8000-000000001813', 'REC', 'Récupération d''heures sup.', 'absence', 'heures', 60, false, true, 25, NULL, false),
  ('00000000-0000-4000-8000-000000001814', 'HSP', 'Heures sup. à payer', 'presence', 'heures', 60, false, true, 25, 'HSP', false),
  ('00000000-0000-4000-8000-000000001815', 'RTT', 'Jour de RTT', 'absence', 'journee', NULL, false, true, 10, 'RTT', true);

-- 13. Absences et événements des employés, autour de la date du jour (en jours : -2 = avant-hier).
-- Cas couverts : congé en cours, passé et à venir ; maladie ; accident du travail ; paternité ;
-- congé sans solde ; congés reportés ; deux événements le même jour (la maladie, plus prioritaire,
-- l'emporte sur le congé, marqué « Non validé ») ; congé posé mais employée venue pointer (le
-- pointage l'emporte) ; mission pendant laquelle l'employé a pointé (la mission neutralise le
-- pointage) ; formation (compté présent) ; absences et formation de quelques heures.
-- « Aujourd'hui » = date UTC : (now() AT TIME ZONE 'UTC')::date ; date + n = n jours plus tard.
INSERT INTO evenements_employes (id, employe_id, evenement_id, date_debut, date_fin, debut_minutes, fin_minutes, remarque, saisi_par)
SELECT a.id::uuid, a.employe::uuid, a.evenement::uuid,
  (now() AT TIME ZONE 'UTC')::date + a.du, (now() AT TIME ZONE 'UTC')::date + a.au, a.de, a.a, a.remarque,
  (SELECT id FROM utilisateurs WHERE est_super_admin ORDER BY cree_le LIMIT 1)
FROM (
  SELECT '00000000-0000-4000-8000-000000002001' AS id, '00000000-0000-4000-8000-000000000306' AS employe, '00000000-0000-4000-8000-000000001801' AS evenement, -2 AS du, 2 AS au, NULL::integer AS de, NULL::integer AS a, 'Congé validé par le chef d''atelier' AS remarque
  UNION ALL SELECT '00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000001803', -3, 0, NULL, NULL, 'Certificat médical reçu'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000001809', 0, 0, NULL, NULL, 'Formation sécurité chariots élévateurs'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002004', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000001808', 2, 2, 600, 720, 'Rendez-vous administratif'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002005', '00000000-0000-4000-8000-000000000315', '00000000-0000-4000-8000-000000001801', 5, 9, NULL, NULL, NULL
  UNION ALL SELECT '00000000-0000-4000-8000-000000002006', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000001801', -3, -2, NULL, NULL, 'Congé posé avant l''arrêt maladie'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002007', '00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000001810', -8, -6, NULL, NULL, 'Mission chez un fournisseur, a badgé sur place'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002008', '00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000001801',
    -- Toujours un jour ouvré : une semaine avant le dernier jour ouvré (dow : 0 = dimanche, 1 = lundi).
    -(CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END + 7),
    -(CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END + 7),
    NULL, NULL, 'Congé posé, finalement venue travailler'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002009', '00000000-0000-4000-8000-000000000308', '00000000-0000-4000-8000-000000001804', -20, -15, NULL, NULL, 'Déclaration d''accident envoyée'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002010', '00000000-0000-4000-8000-000000000309', '00000000-0000-4000-8000-000000001807', -12, -12, NULL, NULL, 'Convenance personnelle'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002011', '00000000-0000-4000-8000-000000000314', '00000000-0000-4000-8000-000000001806', -25, -23, NULL, NULL, 'Naissance'
  -- Heures sup. à récupérer, récupérées et à payer (compteurs du pack 10 et 11), saisies en heures.
  UNION ALL SELECT '00000000-0000-4000-8000-000000002018', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000001812', -3, -3, 1050, 1170, 'Inventaire de fin de mois'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002019', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000001813', -1, -1, 960, 1020, 'Récupération d''une heure'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002020', '00000000-0000-4000-8000-000000000316', '00000000-0000-4000-8000-000000001814', -4, -4, 1080, 1230, 'Commande urgente'
  -- Jour de RTT un jour ouvré (deux semaines avant le dernier jour ouvré), décompté du droit RTT.
  UNION ALL SELECT '00000000-0000-4000-8000-000000002021', '00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000001815',
    -(CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END + 14),
    -(CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END + 14),
    NULL, NULL, 'Jour de RTT'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002012', '00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000001802', -18, -17, NULL, NULL, 'Reliquat de l''an dernier'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002013', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000001801', -15, -11, NULL, NULL, NULL
  UNION ALL SELECT '00000000-0000-4000-8000-000000002014', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000001801', 10, 14, NULL, NULL, 'Prévu, en attente de confirmation du droit'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002015', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000001808', -6, -6, 540, 600, 'Rendez-vous médical'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002016', '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000001801', -40, -36, NULL, NULL, NULL
  UNION ALL SELECT '00000000-0000-4000-8000-000000002017', '00000000-0000-4000-8000-000000000316', '00000000-0000-4000-8000-000000001809', 1, 1, 840, 960, 'Formation d''accueil des stagiaires'
) a;

-- 14. Pointages de badgeuse de tous les employés, des 30 derniers jours jusqu'à maintenant (aujourd'hui :
-- seulement les pointages déjà passés, donc des employés « pas encore arrivés » ou encore présents).
-- Calculés depuis la date du jour : les données restent récentes quel que soit le jour où le script est rejoué.
-- Heures écrites en heure de Casablanca puis ramenées en UTC (- 60 min d'avril à octobre, comme le
-- fuseau Africa/Casablanca de l'application ; dates exactes de changement d'heure non suivies).
--
-- Horaire suivi par chaque employé (poste) : Bureau du lundi au vendredi (BUR, avec repas) ; 2 × 8
-- selon le cycle de son équipe (MAT, APM, repos) ; Journée de 8 h du lundi au samedi (J8, avec repas) ;
-- horaire dynamique (matin, après-midi, ou en alternance). Nadia Tazi (T004) arrive à 10:30 le jeudi :
-- aucune règle ne reconnaît ce pointage, son horaire de secours (Matin) s'applique. Sanaa Kettani (T012)
-- pointe sans aucune affectation.
--
-- Cas particuliers, répartis selon l'employé et le jour (sp = (n × 7 + d × 11) modulo 29) :
-- 0 absent sans justification ; 1 retard de 25 à 44 min ; 2 départ anticipé de 45 min ; 3 sortie
-- oubliée (jour incomplet) ; 4 heures supplémentaires (début et fin après la sortie) ; 5 arrivée
-- 50 min en avance (plage variable ou interdite) ; 6 pause repas trop longue ; 7 pas de pause pointée.
-- Les autres jours sont normaux, avec de petits écarts (retard toléré, retour de repas en retard, sortie
-- en plage neutralisée « hors limite »). Un jour de repos sur neuf environ, l'employé vient travailler
-- de 08:00 à 12:00. Rien n'est pointé un jour d'absence en journée entière (sauf le congé de Zineb
-- Alaoui, venue quand même), ni avant l'embauche, ni le jour des pointages manuels de la section 15.
INSERT INTO pointages (id, employe_id, horodatage, etat, source)
SELECT
  ('00000000-0000-4000-8000-' || lpad((100000 + t.n * 10000 + t.d * 10 + t.k)::text, 12, '0'))::uuid,
  t.id,
  t.horodatage,
  (ARRAY['entree', 'debut_pause', 'fin_pause', 'sortie', 'debut_heures_sup', 'fin_heures_sup'])[t.k + 1],
  'badgeuse'
FROM (
  SELECT m.n, m.id, m.d, m.k,
    (m.jour + make_interval(mins => m.minutes - CASE WHEN extract(month FROM m.jour) BETWEEN 4 AND 10 THEN 60 ELSE 0 END)) AT TIME ZONE 'UTC' AS horodatage
  FROM (
    -- Une ligne par pointage possible (k) : entrée, début et fin de repas, sortie, début et fin d'heures sup.
    SELECT b.n, b.id, b.d, b.jour, k.k,
      CASE k.k
        WHEN 0 THEN b.e + CASE b.sp WHEN 1 THEN 25 + mod(b.h, 20) WHEN 5 THEN -50 ELSE 0 END
        WHEN 1 THEN CASE WHEN b.sp <> 7 AND (b.poste IN ('BUR', 'J8') OR b.sp = 6) THEN b.p1 END
        WHEN 2 THEN CASE WHEN b.sp <> 7 AND (b.poste IN ('BUR', 'J8') OR b.sp = 6) THEN b.p2 + CASE WHEN b.sp = 6 THEN 30 ELSE 0 END END
        WHEN 3 THEN CASE b.sp WHEN 3 THEN NULL WHEN 2 THEN b.s - 45 ELSE b.s END
        WHEN 4 THEN CASE WHEN b.sp = 4 THEN b.s + 10 END
        ELSE CASE WHEN b.sp = 4 THEN b.s + 100 END
      END AS minutes
    FROM (
      -- Heures normales du jour selon le poste (minutes depuis minuit), avec un petit écart propre à chacun.
      SELECT x.n, x.id, x.d, x.jour, x.h, x.poste,
        CASE WHEN x.poste IN ('REPOS', 'NONRECO') THEN 99 ELSE mod(x.n * 7 + x.d * 11, 29) END AS sp,
        CASE x.poste
          WHEN 'BUR' THEN 495 + mod(x.h, 20)
          WHEN 'MAT' THEN 345 + mod(x.h, 20)
          WHEN 'APM' THEN 825 + mod(x.h, 20)
          WHEN 'J8' THEN 450 + mod(x.h, 35)
          WHEN 'NONRECO' THEN 630
          ELSE CASE WHEN mod(x.n + x.d, 9) = 0 THEN 480 END
        END AS e,
        CASE x.poste WHEN 'BUR' THEN 750 + mod(x.h, 8) WHEN 'MAT' THEN 600 + mod(x.h, 5) WHEN 'APM' THEN 1080 + mod(x.h, 5) WHEN 'J8' THEN 720 + mod(x.h, 20) END AS p1,
        CASE x.poste WHEN 'BUR' THEN 800 + mod(x.h, 12) WHEN 'MAT' THEN 625 + mod(x.h, 8) WHEN 'APM' THEN 1105 + mod(x.h, 8) WHEN 'J8' THEN 810 + mod(x.h, 40) END AS p2,
        CASE x.poste
          WHEN 'BUR' THEN 1050 + CASE WHEN mod(x.h, 3) = 0 THEN 0 ELSE mod(x.h, 20) END
          WHEN 'MAT' THEN 840 + mod(x.h, 15)
          WHEN 'APM' THEN 1320 + mod(x.h, 15)
          WHEN 'J8' THEN 1080 + mod(x.h, 30)
          WHEN 'NONRECO' THEN 1080
          ELSE 720
        END AS s
      FROM (
        -- Poste de chaque employé pour chaque jour (js : 0 = lundi ... 6 = dimanche).
        SELECT e.n, e.id, j.d, j.jour, e.n * 37 + j.d * 53 AS h,
          CASE
            WHEN e.horaire = 'alterne' AND j.js = 3 THEN 'NONRECO'
            WHEN e.horaire = 'bureau' THEN CASE WHEN j.js < 5 THEN 'BUR' ELSE 'REPOS' END
            WHEN e.horaire = 'j8' THEN CASE WHEN j.js < 6 THEN 'J8' ELSE 'REPOS' END
            WHEN e.horaire = 'libre' THEN CASE WHEN j.js < 5 THEN 'J8' ELSE 'REPOS' END
            WHEN e.horaire = 'matin' THEN CASE WHEN j.js < 5 THEN 'MAT' ELSE 'REPOS' END
            WHEN e.horaire = 'apm' THEN CASE WHEN j.js < 5 THEN 'APM' ELSE 'REPOS' END
            WHEN e.horaire = 'alterne' THEN CASE WHEN j.js < 5 THEN CASE WHEN mod(j.d, 2) = 0 THEN 'MAT' ELSE 'APM' END ELSE 'REPOS' END
            ELSE (ARRAY['MAT', 'MAT', 'APM', 'APM', 'REPOS', 'REPOS'])[mod(j.jour - e.debut_cycle, 6) + 1]
          END AS poste
        FROM (
          -- n : numéro de l'employé ; horaire : son planning ; debut_cycle : début de l'affectation de son équipe en 2 × 8.
          SELECT 1 AS n, '00000000-0000-4000-8000-000000000301'::uuid AS id, 'bureau' AS horaire, DATE '2026-01-05' AS debut_cycle
          UNION ALL SELECT 2, '00000000-0000-4000-8000-000000000302', 'apm', '2026-01-05'
          UNION ALL SELECT 3, '00000000-0000-4000-8000-000000000303', 'matin', '2026-01-05'
          UNION ALL SELECT 4, '00000000-0000-4000-8000-000000000304', 'alterne', '2026-01-05'
          UNION ALL SELECT 5, '00000000-0000-4000-8000-000000000305', 'cycle', '2026-01-05'
          UNION ALL SELECT 6, '00000000-0000-4000-8000-000000000306', 'cycle', '2026-01-07'
          UNION ALL SELECT 7, '00000000-0000-4000-8000-000000000307', 'cycle', '2026-01-07'
          UNION ALL SELECT 8, '00000000-0000-4000-8000-000000000308', 'cycle', '2026-01-07'
          UNION ALL SELECT 9, '00000000-0000-4000-8000-000000000309', 'cycle', '2026-01-07'
          UNION ALL SELECT 10, '00000000-0000-4000-8000-000000000310', 'cycle', '2026-01-09'
          UNION ALL SELECT 11, '00000000-0000-4000-8000-000000000311', 'cycle', '2026-01-09'
          UNION ALL SELECT 12, '00000000-0000-4000-8000-000000000312', 'libre', '2026-01-05'
          UNION ALL SELECT 13, '00000000-0000-4000-8000-000000000313', 'bureau', '2026-01-05'
          UNION ALL SELECT 14, '00000000-0000-4000-8000-000000000314', 'bureau', '2026-01-05'
          UNION ALL SELECT 15, '00000000-0000-4000-8000-000000000315', 'bureau', '2026-01-05'
          UNION ALL SELECT 16, '00000000-0000-4000-8000-000000000316', 'j8', '2026-01-05'
        ) e
        JOIN employes emp ON emp.id = e.id
        CROSS JOIN (
          -- d : de 0 (aujourd'hui) à 30 jours en arrière ; js : jour de la semaine (isodow 1 = lundi).
          SELECT jours.d, jours.jour, extract(isodow FROM jours.jour)::int - 1 AS js
          FROM (SELECT d, (now() AT TIME ZONE 'UTC')::date - d AS jour FROM generate_series(0, 30) AS d) jours
        ) j
        WHERE j.jour >= emp.date_debut_emploi
          AND (emp.date_fin_emploi IS NULL OR j.jour <= emp.date_fin_emploi)
          -- Jour des pointages manuels de Zineb Alaoui et Anas Mansouri (section 15).
          AND NOT (e.n IN (13, 14) AND j.jour = (now() AT TIME ZONE 'UTC')::date - CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END)
          AND NOT EXISTS (
            SELECT 1 FROM evenements_employes ee JOIN evenements ev ON ev.id = ee.evenement_id
            WHERE ee.employe_id = e.id AND ev.type = 'absence' AND ee.debut_minutes IS NULL
              AND j.jour BETWEEN ee.date_debut AND ee.date_fin
              AND ee.id <> '00000000-0000-4000-8000-000000002008'
          )
      ) x
    ) b
    CROSS JOIN generate_series(0, 5) AS k(k)
    WHERE b.e IS NOT NULL AND b.sp <> 0
  ) m
  WHERE m.minutes IS NOT NULL
) t
WHERE t.horodatage <= now();

-- 14 bis. Pack standard (migrations 0007 à 0009) : tous ses compteurs sont activés pour les essais. Les pointages de la section 14 donnent les durées :
-- journées de plus de 10 h (J8 : heures écrêtées, temps hors limite), semaines de plus de 42 h et 44 h
-- (Bureau : repos compensateur, heures sup. à 125 %), de plus de 52 h (J8 du lundi au samedi, Adil Naciri
-- T016 : heures sup. à 150 %), sorties oubliées (débit). Les sections 12, 13 et 16 donnent les absences,
-- maladie (MAL), missions et formations, heures sup. HSR, REC, HSP, congés (CP) et RTT. Après les événements
-- (section 12), dont les formules citent les codes. supprimer-donnees-test.sql les désactive de nouveau.
UPDATE compteurs SET est_actif = true WHERE numero_pack IS NOT NULL AND NOT est_a_adapter;

-- 15. Pointages saisis à la main (page Pointage manuel), le dernier jour ouvré avant aujourd'hui :
-- deux employés de bureau (08:30-17:30) : Zineb Alaoui (T013) a oublié son badge (à l'heure) et a fait
-- des heures supplémentaires jusqu'à 18:55 ; Anas Mansouri (T014) l'a oublié aussi et est arrivé en
-- retard de 15 minutes. Saisis au nom du premier super administrateur (vide s'il n'existe pas encore).
INSERT INTO pointages (id, employe_id, horodatage, etat, source, remarque, saisi_par)
SELECT
  ('00000000-0000-4000-8000-0000000400' || m.n)::uuid,
  m.employe::uuid,
  (j.jour + make_interval(mins => m.minutes - CASE WHEN extract(month FROM j.jour) BETWEEN 4 AND 10 THEN 60 ELSE 0 END)) AT TIME ZONE 'UTC',
  m.etat,
  'manuel',
  m.remarque,
  (SELECT id FROM utilisateurs WHERE est_super_admin ORDER BY cree_le LIMIT 1)
FROM (
  SELECT '01' AS n, '00000000-0000-4000-8000-000000000313' AS employe, 510 AS minutes, 'entree' AS etat, 'Oubli de badge' AS remarque
  UNION ALL SELECT '02', '00000000-0000-4000-8000-000000000313', 1050, 'sortie', 'Oubli de badge'
  UNION ALL SELECT '03', '00000000-0000-4000-8000-000000000314', 525, 'entree', 'Badge oublié, arrivé en retard'
  UNION ALL SELECT '04', '00000000-0000-4000-8000-000000000314', 1050, 'sortie', 'Badge oublié'
  UNION ALL SELECT '05', '00000000-0000-4000-8000-000000000313', 1065, 'debut_heures_sup', 'Clôture mensuelle'
  UNION ALL SELECT '06', '00000000-0000-4000-8000-000000000313', 1135, 'fin_heures_sup', 'Clôture mensuelle'
) m
CROSS JOIN (
  -- Lundi → vendredi précédent, dimanche → vendredi, sinon la veille.
  SELECT (now() AT TIME ZONE 'UTC')::date - CASE extract(dow FROM (now() AT TIME ZONE 'UTC')::date) WHEN 1 THEN 3 WHEN 0 THEN 2 ELSE 1 END AS jour
) j;

-- 16. Droits aux congés, pour l'année en cours (sauf mention). Cas couverts :
-- Karim Benali (T001) : droit de l'an dernier avec report, dont le solde s'ajoute à celui de cette année ;
-- Hicham Lahlou (T006) : reliquat de 2 jours et solde bloquant ; Imane Berrada (T007) : droit simple
-- (son congé chevauché par la maladie n'est pas décompté) ; Fatima Zahraoui (T015) : 3 jours seulement,
-- dépassés par son congé à venir ; Zineb Alaoui (T013) : supplément d'ancienneté ; Salma Idrissi
-- (T002) : droit provisoire « À confirmer » ; Sanaa Kettani (T012) : congés reportés ; Anas Mansouri
-- (T014) : droit en demi-journées ; Omar Chraibi (T005) : récupération en heures.
INSERT INTO droits_conges (id, employe_id, evenement_id, date_debut, date_fin, jours_acquis, jours_reliquat, supplement_1, unite_saisie, est_confirme, est_reporte, est_bloquant, remarque, saisi_par)
SELECT d.id::uuid, d.employe::uuid, d.evenement::uuid,
  make_date(extract(year FROM (now() AT TIME ZONE 'UTC')::date)::int + d.annee, 1, 1),
  make_date(extract(year FROM (now() AT TIME ZONE 'UTC')::date)::int + d.annee, 12, 31),
  d.acquis, d.reliquat, d.supplement, d.unite, d.confirme, d.reporte, d.bloquant, d.remarque,
  (SELECT id FROM utilisateurs WHERE est_super_admin ORDER BY cree_le LIMIT 1)
FROM (
  SELECT '00000000-0000-4000-8000-000000002100' AS id, '00000000-0000-4000-8000-000000000301' AS employe, '00000000-0000-4000-8000-000000001801' AS evenement, -1 AS annee, 4::numeric AS acquis, 0 AS reliquat, 0 AS supplement, 'journee' AS unite, true AS confirme, true AS reporte, false AS bloquant, 'Solde de l''an dernier reporté' AS remarque
  UNION ALL SELECT '00000000-0000-4000-8000-000000002101', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000001801', 0, 18, 0, 0, 'journee', true, true, false, '1,5 jour par mois travaillé'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002102', '00000000-0000-4000-8000-000000000306', '00000000-0000-4000-8000-000000001801', 0, 18, 2, 0, 'journee', true, false, true, 'Solde bloquant : pas de congé au-delà du droit'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002103', '00000000-0000-4000-8000-000000000307', '00000000-0000-4000-8000-000000001801', 0, 18, 0, 0, 'journee', true, false, false, NULL
  UNION ALL SELECT '00000000-0000-4000-8000-000000002104', '00000000-0000-4000-8000-000000000315', '00000000-0000-4000-8000-000000001801', 0, 3, 0, 0, 'journee', true, false, false, 'Embauchée en cours d''année'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002105', '00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000001801', 0, 18, 0, 2, 'journee', true, false, false, 'Supplément d''ancienneté'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002106', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000001801', 0, 18, 0, 0, 'journee', false, false, false, 'En attente de validation par les ressources humaines'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002107', '00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000001802', 0, 5, 0, 0, 'journee', true, false, false, NULL
  UNION ALL SELECT '00000000-0000-4000-8000-000000002108', '00000000-0000-4000-8000-000000000314', '00000000-0000-4000-8000-000000001801', 0, 9.5, 0, 0, 'demi_journee', true, false, false, 'Contrat à durée déterminée, au prorata'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002109', '00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000001811', 0, 16, 0, 0, 'heures', true, false, false, 'Heures de récupération'
  UNION ALL SELECT '00000000-0000-4000-8000-000000002110', '00000000-0000-4000-8000-000000000313', '00000000-0000-4000-8000-000000001815', 0, 10, 0, 0, 'journee', true, false, false, 'Jours de RTT de l''année'
) d;

COMMIT;
