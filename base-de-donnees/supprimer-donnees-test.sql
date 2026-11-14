-- Retire uniquement les données de test fictives (identifiants commençant par 00000000-0000-4000-8000-).
-- Les données saisies dans l'application ne sont pas touchées.

START TRANSACTION;

DELETE FROM affectations WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM employes WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM groupes WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM rotations WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM calendriers WHERE id LIKE '00000000-0000-4000-8000-%';
DELETE FROM departements WHERE id LIKE '00000000-0000-4000-8000-%' ORDER BY id DESC;
DELETE FROM postes WHERE id LIKE '00000000-0000-4000-8000-%' ORDER BY id DESC;

COMMIT;
