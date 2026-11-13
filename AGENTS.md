# Consignes pour les agents

## Règles du projet (obligatoires)

Ces règles s'appliquent à **chaque prompt** et à chaque modification, même minime, pour tout agent ou outil d'IA qui travaille sur ce dépôt, sous-agents compris.

- @.agents/rules/README-projet.md : fiche du projet (contexte, stack, rôles, exceptions). Toujours.
- @.agents/rules/README-qualite-code.md : qualité de code. Toujours.
- @.agents/rules/README-securite.md : sécurité. Toujours, même en démonstration.
- @.agents/rules/README-design.md : design et contenu. Dès qu'une page, un composant, un texte ou une image est concerné.
- @.agents/rules/README-base-de-donnees.md : base de données. Dès que le schéma, une requête ou des données (même fictives) sont concernés.

Comment les appliquer :

1. Lire ces fichiers en entier avant d'écrire ou de modifier quoi que ce soit. S'ils sont déjà dans le contexte (Claude Code les charge au démarrage), ne pas les relire.
2. En cas de conflit entre deux fichiers, `README-projet.md` l'emporte, seulement si l'exception y est écrite explicitement.
3. Dans `README-projet.md`, un champ encore entre crochets (`[...]`) n'est pas rempli : il ne vaut ni règle ni exception. Appliquer alors les règles communes et leurs valeurs par défaut. Si une information manquante est nécessaire à la tâche, la demander à l'utilisateur plutôt que de l'inventer.
4. Si une demande contredit une règle, le signaler avant d'agir. Une exception acceptée s'inscrit dans le tableau « Exceptions aux règles communes » de `README-projet.md`.
5. Transmettre ces règles à tout sous-agent : lui demander de lire les fichiers de `.agents/rules/` utiles à sa tâche.
6. Avant de terminer une tâche, appliquer la liste « Avant de terminer une tâche » de `README-qualite-code.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
