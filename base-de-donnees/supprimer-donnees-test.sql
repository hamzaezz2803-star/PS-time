-- Retire uniquement les données de test fictives (identifiants commençant par 00000000-0000-4000-8000-).
-- Les données saisies dans l'application ne sont pas touchées.

START TRANSACTION;

-- Compteurs de test et leurs versions (avant les comptes et profils).
DELETE FROM compteurs_versions WHERE compteur_id LIKE '00000000-0000-4000-8000-%';
DELETE FROM compteurs WHERE id LIKE '00000000-0000-4000-8000-%';
-- Règles d'horaire dynamique de test, et celles saisies dans l'application sur un profil de test.
DELETE FROM regles_horaires WHERE id LIKE '00000000-0000-4000-8000-%' OR profil_id LIKE '00000000-0000-4000-8000-%';
DELETE FROM affectations WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM employes WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM groupes WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM rotations WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM profils_horaires WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM departements WHERE id LIKE '00000000-0000-4000-8000-%' ORDER BY id DESC;
DELETE FROM postes WHERE id LIKE '00000000-0000-4000-8000-%' ORDER BY id DESC;
DELETE FROM sites WHERE id LIKE '00000000-0000-4000-8000-%';

COMMIT;
