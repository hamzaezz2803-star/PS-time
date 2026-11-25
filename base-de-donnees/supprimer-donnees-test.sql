-- Retire uniquement les données de test fictives (identifiants commençant par 00000000-0000-4000-8000-).
-- Les données saisies dans l'application ne sont pas touchées.
-- PostgreSQL : à exécuter dans DBeaver (Alt+X) ou avec psql.

BEGIN;

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

COMMIT;
