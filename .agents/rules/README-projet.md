# ps-time — fiche projet

> Modèle à copier dans chaque nouveau projet et à remplir. Remplacer tout ce qui est entre crochets.
> Ce fichier décrit **ce qui est propre au projet**. Les règles communes sont dans :
> `README-qualite-code.md`, `README-securite.md`, `README-base-de-donnees.md`, `README-design.md` et `README1.md` (checklist de conformité avant lancement).
> **En cas de conflit, ce fichier est prioritaire**, à condition que l'exception soit écrite ici explicitement.

Ces règles s'appliquent à **chaque prompt** et à chaque modification du projet.

## Contexte

- **But** : application de pointage des équipes (arrivées, départs, pauses, heures travaillées).
- **Utilisateurs** : [qui l'utilise : administrateurs, clients, collaborateurs, patients...].
- **Client ou commanditaire** : [nom, ou « projet personnel »].
- **Marché** : [pays, langues : français, arabe, anglais...].
- **Statut** : [maquette avec données fictives / MVP / production].

## Stack

- Framework : Next.js 16 (App Router, dossier `src/`), React 19, TypeScript strict, Tailwind CSS v4.
- Base de données : MySQL 8.0.16+ ou MariaDB 10.4+, **une base par client** (l'application est installée chez chaque client, avec sa propre base). Accès via Drizzle ORM (`mysql2`), uniquement côté serveur (`src/lib/donnees/base.ts`). Développement : XAMPP, base `ps-time`.
- Authentification : Better Auth (`src/lib/donnees/authentification.ts`) : e-mail et mot de passe (hachage scrypt), sessions en base dans un cookie httpOnly, 5 tentatives de connexion par minute et par IP, inscription libre désactivée. Les comptes sont créés par un administrateur.
- Hébergement : [Vercel / autre].
- Services externes : [WhatsApp, SMS, e-mail, paiement, IA...].

## Espaces et rôles

| Espace | Chemin | Rôles autorisés |
| --- | --- | --- |
| Connexion | `/connexion` | Tout le monde |
| Tableau de bord | `/espace` | Tout utilisateur connecté et actif |
| Personnel > Départements | `/personnel/departements` | Lecture : tout utilisateur connecté. Modification : super administrateur |
| Changement de mot de passe | `/changer-mot-de-passe` | Tout utilisateur connecté et actif |

- Les pages du tableau de bord sont dans le groupe de routes `src/app/(connecte)/`, qui partage le menu latéral (`src/components/tableau-de-bord/`).
- Le menu affiche « Bientôt » (sans lien) pour les fonctionnalités pas encore développées : Personnes, Postes.

- `src/proxy.ts` redirige vers `/connexion` sans cookie de session (confort seulement). La vraie vérification est faite dans chaque page et action par `obtenirUtilisateurConnecte()` (`src/lib/donnees/session.ts`).
- Un compte désactivé (`est_actif = 0`) ne peut plus ouvrir de session, et ses sessions existantes sont refusées.
- Tant que `doit_changer_mot_de_passe = 1`, l'espace renvoie vers `/changer-mot-de-passe`.

## Règles métier

- [Règle 1, ex. : un collaborateur ne voit que son propre solde.]
- [Règle 2, ex. : les montants sont toujours en MAD avec 2 décimales.]
- [Règle 3, ex. : un créneau ne peut pas être réservé deux fois.]

## Données

- Schéma : `src/lib/donnees/schema.ts` ; migrations SQL : `base-de-donnees/migrations/`.
- Tables principales :
  - `utilisateurs` : identifiant et e-mail uniques en minuscules, nom, compte actif, super administrateur, mot de passe à changer ;
  - `comptes` : moyen de connexion (empreinte du mot de passe, fournisseur `credential`) ;
  - `sessions` : sessions ouvertes (jeton, expiration, IP et navigateur pour la sécurité) ;
  - `verifications` : jetons temporaires (réinitialisation, vérification d'e-mail) ;
  - `departements` : arbre parent/enfants (`parent_id`). Nom unique parmi les départements d'un même parent ; un département qui a des sous-départements ne peut pas être supprimé (clé étrangère `restrict`).
- `sessions`, `comptes` et `verifications` suivent le modèle imposé par Better Auth. Certaines colonnes (image, jetons de connexion externe) sont exigées mais restent vides.
- Pas de colonne `organisation_id` : une installation = un client = une base.
- Reprise de l'ancien logiciel : ses mots de passe (MD5 + sel) ne sont pas repris. Chaque utilisateur repart avec un mot de passe à changer.
- Données sensibles traitées : [aucune / santé / financières / mineurs...] et précautions associées.
- Données à ne jamais collecter : [CIN, date de naissance...].

## Design

- Couleurs (tirées du logo, définies dans `src/app/globals.css`) : primaire `#0b4fb3`, marine `#0a2463`, accent `#1aa3e8`, texte `#0f1b33`, fond `#f6f9fd`.
- Logo : `public/logo-ps-time.webp`.
- Polices : Geist (OFL), via `next/font`.
- Priorité d'affichage : [mobile d'abord pour l'espace X, ordinateur pour l'espace Y].
- Thème sombre : [oui / non].

## Bibliothèques autorisées

| Besoin | Bibliothèque |
| --- | --- |
| Authentification | `better-auth` |
| Base de données et migrations | `drizzle-orm`, `drizzle-kit`, `mysql2` |
| Isolation du code serveur | `server-only` |
| Validation des données | `zod` |
| Icônes | `lucide-react` |
| Assemblage des classes CSS | `clsx`, `tailwind-merge` |

## Structure des dossiers

```text
src/
  app/                  pages et Server Actions (connexion, espace, changer-mot-de-passe, api/auth)
  components/ui/        composants réutilisables (bouton, champ-saisie, etiquette, message-erreur, chargement)
  components/connexion/ composants de l'écran de connexion
  components/espace/    composants du changement de mot de passe
  components/tableau-de-bord/  cadre et menu latéral des pages connectées
  components/departements/     arbre et formulaires des départements
  lib/actions/          Server Actions partagées (déconnexion)
  lib/donnees/          accès aux données : base, schéma, authentification, session, utilisateurs, départements
  lib/metier/           règles métier pures et leurs tests (*.test.ts, lancés par npm test)
  lib/client-authentification.ts  client Better Auth du navigateur
  proxy.ts              redirection rapide des pages connectées
scripts/                scripts d'installation (création du premier administrateur)
base-de-donnees/migrations/  migrations SQL versionnées
  lib/validation/       schémas zod
  lib/textes/           textes affichés
  lib/constantes.ts     limites et seuils
  types/index.ts        types partagés
```

## Exceptions aux règles communes

Lister ici, de façon explicite, toute règle commune volontairement non appliquée, avec la raison et la date de fin prévue.

| Règle commune | Exception | Raison | Jusqu'à quand |
| --- | --- | --- | --- |
| `id uuid default gen_random_uuid()` | `char(36)`, UUID v4 généré par l'application (`crypto.randomUUID()`) | MySQL/MariaDB n'ont ni type uuid ni UUID v4 natif (10.4) | Définitif |
| Dates en `timestamptz` | `datetime(3)` en UTC (connexion en `time_zone = '+00:00'`) | Pas de `timestamptz` en MySQL ; `timestamp` est limité à 2038 | Définitif |
| Trigger `maj_modifie_le` | `ON UPDATE CURRENT_TIMESTAMP(3)` sur `modifie_le` | Équivalent natif MySQL | Définitif |
| RLS sur toutes les tables | Non applicable | La base n'est jamais accessible depuis le navigateur ; une base par client | Définitif |
| Migrations Supabase (`npx supabase ...`) | `npm run db:generer` puis `npm run db:migrer` (drizzle-kit) | Pas de Supabase | Définitif |
| Types générés par `supabase gen types` | Types déduits du schéma Drizzle | Le schéma TypeScript est la source | Définitif |
| Double authentification (MFA) des administrateurs | Pas encore en place | Première version de la connexion | Avant la mise en production chez un client |
| Limitation de tentatives partagée | Compteur en mémoire du serveur (remis à zéro au redémarrage) | Une installation = un seul serveur | Si un client utilise plusieurs serveurs |

## Installation et lancement

```bash
npm install
cp .env.example .env.local   # puis remplir DATABASE_URL, BETTER_AUTH_SECRET et BETTER_AUTH_URL
npm run db:migrer            # crée ou met à jour les tables
npm run admin:creer -- --identifiant admin --email admin@client.ma --nom "Nom Prénom"
npm run dev
```

- `BETTER_AUTH_SECRET` est différent pour chaque client (commande de génération dans `.env.example`).
- `admin:creer` affiche une seule fois un mot de passe temporaire, à changer à la première connexion.

Modifier le schéma : éditer `src/lib/donnees/schema.ts`, puis `npm run db:generer -- --name <nom_explicite>` (relire le SQL produit) et `npm run db:migrer`. Ne jamais modifier une migration déjà appliquée chez un client.

## Avant de terminer une tâche

- Appliquer la liste « Avant de terminer une tâche » de `README-qualite-code.md`.
- `npm test` : tests de la logique métier (lanceur intégré à Node, sans dépendance).
- Tester les pages connectées sur ordinateur et sur mobile (360 px, menu en tiroir).
