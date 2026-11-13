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
- Authentification : [Auth.js ou autre service éprouvé, à choisir]. En attendant, `src/lib/donnees/authentification.ts` refuse toute connexion.
- Hébergement : [Vercel / autre].
- Services externes : [WhatsApp, SMS, e-mail, paiement, IA...].

## Espaces et rôles

| Espace | Chemin | Rôles autorisés |
| --- | --- | --- |
| [Administrateur] | [`/admin/*`] | [`admin`, `super_admin`] |
| [Utilisateur] | [`/espace/*`] | [`utilisateur`] |
| [Public] | [`/`] | Tout le monde |

## Règles métier

- [Règle 1, ex. : un collaborateur ne voit que son propre solde.]
- [Règle 2, ex. : les montants sont toujours en MAD avec 2 décimales.]
- [Règle 3, ex. : un créneau ne peut pas être réservé deux fois.]

## Données

- Schéma : `src/lib/donnees/schema.ts` ; migrations SQL : `base-de-donnees/migrations/`.
- Tables principales : `utilisateurs` (identifiant et e-mail uniques en minuscules, empreinte du mot de passe, compte actif, super administrateur, mot de passe à changer).
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
| Base de données et migrations | `drizzle-orm`, `drizzle-kit`, `mysql2` |
| Isolation du code serveur | `server-only` |
| Validation des données | `zod` |
| Icônes | `lucide-react` |
| Assemblage des classes CSS | `clsx`, `tailwind-merge` |

## Structure des dossiers

```text
src/
  app/                  pages et Server Actions (ex. connexion/page.tsx, connexion/actions.ts)
  components/ui/        composants réutilisables (bouton, champ-saisie, etiquette, message-erreur)
  components/connexion/ composants de l'écran de connexion
  lib/donnees/          accès aux données et aux services externes
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

## Installation et lancement

```bash
npm install
cp .env.example .env.local   # puis remplir DATABASE_URL avec la base du client
npm run db:migrer            # crée ou met à jour les tables
npm run dev
```

Modifier le schéma : éditer `src/lib/donnees/schema.ts`, puis `npm run db:generer -- --name <nom_explicite>` (relire le SQL produit) et `npm run db:migrer`. Ne jamais modifier une migration déjà appliquée chez un client.

## Avant de terminer une tâche

- Appliquer la liste « Avant de terminer une tâche » de `README-qualite-code.md`.
- [Vérification propre au projet, ex. : tester l'interface en arabe.]
