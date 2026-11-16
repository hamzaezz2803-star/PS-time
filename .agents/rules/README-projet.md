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
- Authentification : Better Auth (`src/lib/donnees/authentification.ts`) : **identifiant** et mot de passe (plugin `username` relié à la colonne `identifiant` ; 3 à 50 caractères `a-z 0-9 . - _`, sans tenir compte des majuscules), hachage scrypt, sessions en base dans un cookie httpOnly, 5 tentatives de connexion par minute et par IP, inscription libre désactivée. Routes coupées : `/sign-in/email`, `/update-user`, `/is-username-available`. Les comptes sont créés par un administrateur.
- Première installation (`src/app/connexion/actions.ts`, `lib/donnees/installation.ts`) : tant qu'**aucun utilisateur** n'existe, l'identifiant `pstime` + le mot de passe du jour (`lib/metier/mot-de-passe-du-jour.ts` : JJMM + quatre chiffres partant du numéro du jour, lundi = 1 ... dimanche = 7, additionnés chiffre par chiffre sans retenue ; ex. lundi 16/11 : 1611 + 1234 = 2845, dimanche 15/11 : 1511 + 7890 = 8301, date de Casablanca) n'ouvre **pas** de session : il ouvre une fenêtre de création du premier super administrateur (identifiant, mot de passe, confirmation), autorisée par un jeton à usage unique de 10 minutes (empreinte SHA-256 dans `verifications`). On revient ensuite à la connexion avec ce nouveau compte. Dès qu'un utilisateur existe, `pstime` est refusé avec le même message qu'un mauvais mot de passe. Limites : 5 essais par minute et par IP, 30 essais par jour toutes adresses confondues, comparaison en temps constant, création journalisée.
- Hébergement : [Vercel / autre].
- Services externes : [WhatsApp, SMS, e-mail, paiement, IA...].

## Espaces et rôles

| Espace | Chemin | Rôles autorisés |
| --- | --- | --- |
| Connexion | `/connexion` | Tout le monde |
| Tableau de bord | `/espace` | Tout utilisateur connecté et actif |
| Personnel > Sites, Départements, Postes, Personnes | `/personnel/...` | Module **Personnel** (super administrateur, ou administrateur à qui il est accordé). Départements et Postes restent lisibles par tout compte connecté ; la modification exige le module |
| Export des personnes | `/personnel/personnes/export-excel` (fichier .xlsx), `/impression/personnes` (version imprimable, enregistrable en PDF) | Module Personnel. Colonnes de la liste seulement (ni pièce d'identité, ni e-mail), 10 000 lignes au plus, chaque export tracé dans le journal du serveur (utilisateur, format, nombre de lignes) |
| Planning > Calendriers, Rotations, Groupes, Affectations | `/programme/...` | Module **Planning** |
| Présence > Gestion des exceptions > Pointage manuel | `/exceptions/pointages-manuels` | Module **Présence** |
| Administration > Utilisateurs | `/administration/utilisateurs` | Super administrateur uniquement |
| Changement de mot de passe | `/changer-mot-de-passe` | Tout utilisateur connecté et actif |

- Les pages du tableau de bord sont dans le groupe de routes `src/app/(connecte)/`, qui partage le menu latéral (`src/components/tableau-de-bord/`).
- Rôles et modules (`lib/metier/droits.ts`) : le **super administrateur** (créé par `pstime` ou `admin:creer`) a tout, plus Administration > Utilisateurs. Il crée des **administrateurs** (nom, identifiant, mot de passe provisoire à changer à la première connexion) et coche leurs modules : Personnel, Planning, Présence, ou « Tout ». Un administrateur ne voit dans le menu et le tableau de bord que ses modules ; chaque page et chaque action serveur revérifie le module (`peutGererModule`, `peutGerer`). Les droits sont relus à chaque requête : un module retiré disparaît aussitôt. Modification : nom, modules, compte actif, nouveau mot de passe provisoire facultatif (désactivation ou nouveau mot de passe ferment les sessions). On ne peut ni se désactiver soi-même, ni supprimer un super administrateur. Création, modification et suppression tracées dans le journal du serveur (auteur, compte, modules, jamais le mot de passe).
- Recherche : Départements et Postes filtrent l'arbre dans le navigateur (parents gardés, tout déplié ; postes aussi par numéro). Personnes : filtres nom ou prénom, matricule ou badge, département (sous-départements compris), dans l'URL ; la pagination et les exports suivent les filtres.
- Menu Présence > Gestion des exceptions > Pointage manuel : liste paginée des pointages saisis à la main (filtres employé et jour), fenêtre de saisie pour un ou plusieurs employés (filtre par département, recherche, tout cocher), date et heure locales, état (Entrée/Check In, Sortie/Check Out, Début de pause/Break Out, Fin de pause/Break In, Début et fin d'heures sup./Overtime In et Out), remarque. « Enregistrer et nouveau » garde les employés cochés pour enchaîner. Suppression avec confirmation.
- Résultat d'un pointage (colonne « Résultat » et message après l'enregistrement), calculé à l'affichage d'après le planning, jamais stocké : affectation de l'employé (sinon celle de son groupe) qui couvre le jour, jour de la rotation (semaine type ou cycle depuis le début de l'affectation), calendrier du jour ou repos. Un pointage de fin de nuit se rattache au service de nuit commencé la veille s'il tombe dans ses fenêtres. Règles (`lib/metier/statut-pointage.ts`) :
  - Entrée : hors fenêtre si avant « entrée acceptée avant » ou après « entrée acceptée après » ; en retard si l'écart dépasse la tolérance (retard compté en entier) ; sinon à l'heure.
  - Sortie : hors fenêtre en dehors de la fenêtre de sortie (élargie au-delà du plafond d'heures sup. quand elles sont actives) ; départ anticipé si l'avance dépasse la tolérance ; heures sup. si actives, comptées après le délai « commencer après », à partir du minimum, plafonnées au maximum ; sinon à l'heure.
  - Pauses : pas de pause prévue ; début avant l'heure de pause = pause anticipée ; fin après l'heure de fin de pause = retour en retard ; hors service = hors fenêtre.
  - Heures sup. (début, fin) : non prévues si le calendrier ne les compte pas ; avant la fin du service = signalé.
  - Jour de repos ou aucune affectation : signalé tel quel.
- Barre du haut : cloche de notifications (panneau vide tant que le pointage n'existe pas, sans chiffre inventé).
- Menu Personnel, dans l'ordre de saisie : Sites, Départements, Postes, Personnes. Sites : liste simple (nom unique, adresse facultative, nombre de départements, postes et employés rattachés), création, modification et suppression en fenêtre ; un site encore utilisé ne peut pas être supprimé. Chaque département, poste et employé a un champ « Site » facultatif (nom du site affiché dans l'arbre et sur la fiche).
- Toutes les entrées du menu Personnel (Sites, Départements, Postes, Personnes) sont développées. Personnes : liste paginée, puis création, fiche, modification et suppression (avec confirmation) dans des fenêtres modales. Départements et Postes : arbre sur toute la largeur (icône distincte pour un parent et pour un enfant, nombre d'employés par ligne : sous-départements compris pour un département, occupants exacts pour un poste), bouton « Nouveau » en haut, création, modification et suppression en fenêtre (composant commun `components/arbre/gestion-arbre.tsx`).
- Menu Planning > Programme : liste simple + fenêtres (composant commun `components/liste/gestion-liste.tsx`). Ordre d'utilisation : 1. Calendriers (créneau horaire, temps de travail calculé en direct, service de nuit, fenêtres de pointage, tolérances, heures supplémentaires) ; 2. Rotations (semaine type du lundi au dimanche, ou cycle de 1 à 31 jours ; un calendrier ou « Repos » par jour) ; 3. Groupes (nom, description, membres cochés dans une liste avec recherche) ; 4. Affectations (une rotation pour un groupe ou un employé, de telle date à telle date ou sans fin).

- `src/proxy.ts` redirige vers `/connexion` sans cookie de session (confort seulement). La vraie vérification est faite dans chaque page et action par `obtenirUtilisateurConnecte()` (`src/lib/donnees/session.ts`).
- Un compte désactivé (`est_actif = 0`) ne peut plus ouvrir de session, et ses sessions existantes sont refusées.
- Tant que `doit_changer_mot_de_passe = 1`, l'espace renvoie vers `/changer-mot-de-passe`. Après tout changement de mot de passe (provisoire ou volontaire), toutes les sessions sont fermées et on revient sur `/connexion?motDePasseChange=1` (message de confirmation) pour se reconnecter avec le nouveau mot de passe ; on arrive alors sur le tableau de bord avec ses seuls modules.
- Gestion des utilisateurs : colonne « Rôle » (Super administrateur : le premier compte, créé avec `pstime` ; Administrateur : les comptes qu'il crée).

## Règles métier

- [Règle 1, ex. : un collaborateur ne voit que son propre solde.]
- [Règle 2, ex. : les montants sont toujours en MAD avec 2 décimales.]
- [Règle 3, ex. : un créneau ne peut pas être réservé deux fois.]

## Données

- Schéma : `src/lib/donnees/schema.ts` ; migrations SQL : `base-de-donnees/migrations/`.
- Tables principales :
  - `utilisateurs` : identifiant (sert à la connexion) et e-mail uniques en minuscules, nom, compte actif, super administrateur, mot de passe à changer. Le premier compte créé par `pstime` reçoit un e-mail interne non utilisé (`<identifiant>@utilisateurs.ps-time.invalid`, exigé par Better Auth) ;
  - `sites` : entreprises ou établissements gérés, nom unique, adresse facultative. `departements`, `postes` et `employes` ont un `site_id` facultatif (`restrict` : un site utilisé ne peut pas être supprimé) ;
  - `comptes` : moyen de connexion (empreinte du mot de passe, fournisseur `credential`) ;
  - `autorisations_utilisateurs` : modules accordés à un administrateur (une ligne par module : `personnel`, `planning`, `presence`, contrainte `check`, unique par compte, `cascade`). Aucune ligne pour un super administrateur, qui a tout ;
  - `sessions` : sessions ouvertes (jeton, expiration, IP et navigateur pour la sécurité) ;
  - `verifications` : jetons temporaires (réinitialisation, vérification d'e-mail, jeton d'installation `installation`) ;
  - `departements` : arbre parent/enfants (`parent_id`). Nom unique parmi les départements d'un même parent ; un département qui a des sous-départements ou des employés ne peut pas être supprimé (clé étrangère `restrict`).
  - `postes` : arbre parent/enfants, numéro (`code`) unique, ordre d'affichage.
  - `employes` : matricule et numéro de badge obligatoires et uniques, prénom, nom, département (obligatoire, `restrict`), poste (facultatif, `set null`), genre (`homme`, `femme`), pièce d'identité (type `cin`, `passeport` ou `carte_sejour` + numéro, renseignés ensemble, uniques), téléphone E.164, e-mail unique en minuscules, type d'emploi (`cdi`, `cdd`, `interim`, `stage`), dates d'embauche, de début et de fin d'emploi (type `date`, fin ≥ embauche et fin ≥ début) ;
  - `photos_employes` : photo de profil facultative d'un employé (une au plus), en base (`mediumblob`) : JPEG, PNG ou WebP vérifié par sa signature, 512 Ko au plus (contrainte `check`). Recadrée en carré et réduite à 512 px dans le navigateur avant l'envoi. Servie uniquement aux super administrateurs par `/personnel/personnes/photo/[id]` (jamais publique, jamais dans les exports). Supprimée avec l'employé (`cascade`).
  - `informations_employes` : informations supplémentaires propres à un employé (libellé + valeur, 20 au maximum, libellé unique par employé), saisies dans son formulaire et supprimées avec lui (`cascade`).
  - `calendriers` : créneau horaire en minutes depuis minuit (début ≠ fin ; fin < début = service de nuit), pause facultative de … à … (`pause_debut_minutes`, `pause_fin_minutes`, toutes deux vides ou toutes deux remplies, comprise dans le service), fenêtres d'entrée et de sortie, tolérances de retard et de départ anticipé, pointages obligatoires, heures supplémentaires (après, minimum, maximum par jour, 0 = sans limite). Nom unique.
  - `pointages` : un pointage d'un employé (`horodatage` en UTC, saisi en heure de Casablanca), `etat` (`entree`, `sortie`, `debut_pause`, `fin_pause`, `debut_heures_sup`, `fin_heures_sup`), `source` (`manuel` pour l'instant, `badgeuse` plus tard), remarque facultative, `saisi_par` (compte qui l'a saisi, `set null`). Un même état ne peut pas être pointé deux fois au même instant pour un employé (index unique : les doublons sont ignorés et annoncés). Jamais dans le futur (5 minutes de marge), 500 employés au plus par saisie. Supprimés avec l'employé (`cascade`) ; seuls les pointages manuels se suppriment depuis l'application. Chaque saisie est tracée dans le journal du serveur (compte, état, nombre).
  - `rotations` + `jours_rotation` : type `hebdomadaire` (7 jours, lundi = 0) ou `cycle` (1 à 31 jours, compté depuis le début de l'affectation) ; un jour absent = repos. Un calendrier utilisé par une rotation ne peut pas être supprimé (`restrict`).
  - `groupes` : nom unique, description ; un employé appartient à un seul groupe (`employes.groupe_id`, `set null`).
  - `affectations` : une rotation pour un groupe OU un employé (contrainte `check`), date de début, date de fin facultative. Pas de chevauchement de périodes pour une même cible (vérifié dans une transaction qui verrouille la cible). L'affectation d'un employé passe avant celle de son groupe. Supprimées avec leur groupe ou leur employé (dans une transaction) ; une rotation affectée ne peut pas être supprimée.
- Champ volontairement non repris de l'ancien logiciel (minimisation) : date de naissance. Biométrie et mot de passe de la badgeuse viendront avec la gestion des badgeuses.
- La pièce d'identité est une donnée sensible : réservée aux super administrateurs, jamais écrite dans les journaux.
- `sessions`, `comptes` et `verifications` suivent le modèle imposé par Better Auth. Certaines colonnes (image, jetons de connexion externe) sont exigées mais restent vides.
- Pas de colonne `organisation_id` : une installation = un client = une base.
- Reprise de l'ancien logiciel : ses mots de passe (MD5 + sel) ne sont pas repris. Chaque utilisateur repart avec un mot de passe à changer.
- Données sensibles traitées : [aucune / santé / financières / mineurs...] et précautions associées.
- Données à ne jamais collecter : [CIN, date de naissance...].

## Design

- Couleurs (tirées du logo, définies dans `src/app/globals.css`) : primaire `#0b4fb3`, marine `#0a2463`, accent `#1aa3e8`, texte `#0f1b33`, fond `#f6f9fd`.
- Logo : `public/logo-ps-time.webp`.
- Police : Hanken Grotesk (OFL), via `next/font` ; chiffres à chasse fixe (`tabular-nums`) pour les heures.
- Cadre des pages connectées : menu latéral sombre (marine `#0a2463`, page active repérée par une barre accent et un fond plus clair) repliable en icônes (Ctrl+B, préférence gardée dans le navigateur), barre du haut blanche avec fil d'Ariane et horloge en direct (fuseau Africa/Casablanca), zone de travail sur fond `#f6f9fd`, compte utilisateur en pied de menu.
- Échelle d'ombres unique (`shadow-carte`, `shadow-survol`, `shadow-flottant`) et en-tête de page commun (`components/ui/en-tete-page.tsx`).
- Tableau de bord : bannière d'accueil avec **horloge à palettes** (heures, minutes, secondes à Casablanca, `components/ui/horloge-palettes.tsx` : sans bibliothèque, animation de 2 × 150 ms coupée si « réduire les animations », `role="timer"` sans annonce à chaque seconde) et date du jour ; la petite horloge de la barre du haut est masquée sur cette page. Puis chiffres réels (personnes, départements, postes : module Personnel) et les quatre étapes du planning (module Planning) ; un compte sans module voit un message l'invitant à demander un accès. Pas de cloche de notifications ni de thème sombre tant que ces fonctions n'existent pas.
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
| Export Excel (côté serveur uniquement) | `exceljs` (MIT). Sa dépendance `uuid` est forcée en ^11.1.1 par `overrides` dans `package.json` (alerte modérée sur les anciennes versions) |

## Structure des dossiers

```text
src/
  app/                  pages et Server Actions (connexion, espace, changer-mot-de-passe, api/auth)
  components/ui/        composants réutilisables (bouton, champs, champ-recherche, pastille, en-tete-page, messages, chargement, fenetre-modale, onglets, pied-fenetre)
  components/connexion/ composants de l'écran de connexion
  components/espace/    tableau de bord (bannière avec horloge, cartes chiffrées, étapes du planning) et changement de mot de passe
  components/utilisateurs/     gestion des comptes : liste, formulaire, choix des modules
  components/tableau-de-bord/  cadre et menu latéral des pages connectées
  components/sites/            liste et formulaire des sites, champ « Site » partagé
  components/departements/     arbre et formulaires des départements
  components/postes/           arbre et formulaires des postes
  components/personnes/        gestion des employés : fenêtres de création, fiche, modification, suppression ; liste paginée
  components/liste/            liste simple avec fenêtres (création, modification, suppression) et état des formulaires
  components/programme/        calendriers, rotations, groupes (choix des membres) et affectations
  components/employes/         choix d'employés par cases à cocher (recherche, filtre par département), partagé
  components/exceptions/       pointages manuels : liste, fenêtre de saisie, suppression
  lib/actions/          Server Actions partagées (déconnexion)
  lib/export/           exports serveur (classeur Excel des employés, préparation et contrôle des droits)
  app/impression/       pages imprimables hors du cadre du tableau de bord (liste des employés en PDF)
  lib/donnees/          accès aux données : base, schéma, authentification, installation (compte pstime), session, utilisateurs, sites, départements, postes, employés, calendriers, rotations, groupes, affectations
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
| Dates en `timestamptz` (jours du calendrier) | `date` pour l'embauche et la fin d'emploi | Un jour sans heure n'a pas de fuseau | Définitif |
| Trigger `maj_modifie_le` | `ON UPDATE CURRENT_TIMESTAMP(3)` sur `modifie_le` | Équivalent natif MySQL | Définitif |
| RLS sur toutes les tables | Non applicable | La base n'est jamais accessible depuis le navigateur ; une base par client | Définitif |
| Migrations Supabase (`npx supabase ...`) | `npm run db:generer` puis `npm run db:migrer` (drizzle-kit) | Pas de Supabase | Définitif |
| Types générés par `supabase gen types` | Types déduits du schéma Drizzle | Le schéma TypeScript est la source | Définitif |
| Pas de CIN « au cas où » (minimisation) | Type et numéro de pièce d'identité, facultatifs | Déclaration CNSS des salariés (obligation de l'employeur) | Définitif, à revoir si la déclaration CNSS n'est pas faite depuis l'application |
| Minimisation des données personnelles | Genre, facultatif | Demandé par le responsable du projet (usage précis à documenter) | À confirmer avant la mise en production |
| Double authentification (MFA) des administrateurs | Pas encore en place | Première version de la connexion | Avant la mise en production chez un client |
| Minimisation des données personnelles | Photo de profil, facultative | Demandé par le responsable du projet (reconnaître l'employé, future badgeuse) | À confirmer avant la mise en production |
| Limitation de tentatives partagée | Compteur en mémoire du serveur (remis à zéro au redémarrage) | Une installation = un seul serveur | Si un client utilise plusieurs serveurs |
| Pas de système d'authentification maison ; mot de passe non devinable | Compte d'installation `pstime` + mot de passe du jour calculé (10 000 valeurs, règle connue de l'installateur) | Demandé par le responsable du projet (16/11/2026) : l'installateur ouvre l'application chez le client sans script. Limité à une base **sans aucun utilisateur**, n'ouvre jamais de session (seulement la création du premier administrateur, jeton à usage unique de 10 min), 5 essais/min/IP et 30 essais/jour au total | Définitif, tant que `pstime` reste limité à la première installation |

## Installation et lancement

```bash
npm install
cp .env.example .env.local   # puis remplir DATABASE_URL, BETTER_AUTH_SECRET et BETTER_AUTH_URL
npm run db:migrer            # crée ou met à jour les tables
npm run dev
```

- Premier compte : sur `/connexion`, identifiant `pstime` et mot de passe du jour, puis choisir l'identifiant et le mot de passe de l'administrateur dans la fenêtre qui s'ouvre, et se reconnecter avec. Ne fonctionne que sur une base sans utilisateur.
- Alternative en ligne de commande : `npm run admin:creer -- --identifiant admin --email admin@client.ma --nom "Nom Prénom"`.

- `BETTER_AUTH_SECRET` est différent pour chaque client (commande de génération dans `.env.example`).
- `admin:creer` affiche une seule fois un mot de passe temporaire, à changer à la première connexion.
- Sans accès direct à la base (phpMyAdmin seulement) : `npm run --silent sql:utilisateur -- --identifiant ... --email ... --nom "..." [--super-admin]` affiche le SQL à exécuter (empreinte scrypt incluse, jamais le mot de passe en clair) et le mot de passe temporaire. On ne crée pas de mot de passe en SQL pur : MySQL ne propose que MD5/SHA, interdits par les règles.

Données de test fictives (développement uniquement, jamais chez un client) : exécuter `base-de-donnees/donnees-test.sql` dans phpMyAdmin (onglet SQL ou Importer), ou `mysql -u root ps-time < base-de-donnees/donnees-test.sql`. Rejouable ; `base-de-donnees/supprimer-donnees-test.sql` retire ces seules données (identifiants commençant par `00000000-0000-4000-8000-`).

Modifier le schéma : éditer `src/lib/donnees/schema.ts`, puis `npm run db:generer -- --name <nom_explicite>` (relire le SQL produit) et `npm run db:migrer`. Ne jamais modifier une migration déjà appliquée chez un client.

## Avant de terminer une tâche

- Appliquer la liste « Avant de terminer une tâche » de `README-qualite-code.md`.
- `npm test` : tests de la logique métier (lanceur intégré à Node, sans dépendance).
- Tester les pages connectées sur ordinateur et sur mobile (360 px, menu en tiroir).
