# Cahier des charges : PS Time

> Application web de pointage et de gestion du temps des équipes.
> Version du document : 1.0 du 25/11/2026. Rédigé à partir de l'état réel du dépôt (`.agents/rules/README-projet.md`).
> Les éléments marqués **À préciser** restent à valider avec le responsable du projet.

## Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
2. [Acteurs et rôles](#2-acteurs-et-rôles)
3. [Besoins fonctionnels](#3-besoins-fonctionnels)
4. [Règles métier](#4-règles-métier)
5. [Besoins non fonctionnels](#5-besoins-non-fonctionnels)
6. [Architecture technique](#6-architecture-technique)
7. [Modèle de données](#7-modèle-de-données)
8. [Avancement et lots](#8-avancement-et-lots)
9. [Recette et critères d'acceptation](#9-recette-et-critères-dacceptation)
10. [Livrables](#10-livrables)
11. [Points à préciser](#11-points-à-préciser)
12. [Glossaire](#12-glossaire)

---

## 1. Présentation du projet

### 1.1 Contexte

Les entreprises clientes suivent aujourd'hui le temps de présence de leurs équipes avec un ancien logiciel (type Gestor Easy) et des badgeuses. PS Time remplace ce logiciel par une application web moderne, installée chez chaque client.

### 1.2 Objectifs

- Enregistrer les **arrivées, départs, pauses et heures supplémentaires** des employés (badgeuse ou saisie manuelle).
- Comparer ces pointages au **planning prévu** (profils horaires, rotations, horaire dynamique) pour calculer retards, absences et heures travaillées.
- Gérer les **absences justifiées** (événements) et les **droits aux congés** avec leurs soldes.
- Produire des **compteurs** paramétrables par formule et des **états** exportables (Excel, PDF).
- Donner à la direction un **tableau de bord** de présence fiable, calculé sur les vrais pointages.
- Garantir la **sécurité** et la **traçabilité** de toutes les actions, conformément à la loi 09-08.

### 1.3 Périmètre

| Dans le périmètre | Hors périmètre (pour l'instant) |
| --- | --- |
| Gestion du personnel (sites, départements, postes, employés) | Paie (seul un code de paie est transmis) |
| Planning (profils horaires, rotations, groupes, affectations, horaire dynamique) | Services de nuit (une journée va de 00:00 à 24:00) |
| Pointages manuels et calcul des résultats | Stockage de données biométriques (visage, empreintes) |
| Événements, droits aux congés, compteurs, états | Espace employé (pointage à distance depuis un téléphone) |
| Administration : comptes, droits par page, apparence, historique, sauvegarde | Gestion des badgeuses (page d'attente seulement) |

### 1.4 Mode de déploiement

- **Une installation par client**, avec sa propre base de données (pas de base partagée entre clients).
- Base PostgreSQL sur un **serveur séparé** de l'application.

---

## 2. Acteurs et rôles

| Acteur | Description | Droits |
| --- | --- | --- |
| Installateur | Technicien qui met en service l'application chez le client | Compte `pstime` + mot de passe du jour, uniquement sur une base vide, pour créer le premier super administrateur |
| Super administrateur | Responsable de l'installation chez le client | Accès à tout, plus Utilisateurs, Apparence, Historique, Sauvegarde et Badgeuses |
| Administrateur | Gestionnaire RH, chef d'équipe, responsable de site | Uniquement les pages cochées une par une par le super administrateur (20 pages possibles) |
| Employé | Personne qui pointe | Pas de compte dans la version actuelle (espace employé prévu plus tard) |

Règles d'accès :

- Les droits sont relus à **chaque requête** : une page retirée disparaît aussitôt.
- Chaque page et chaque action serveur revérifie le droit (jamais seulement le menu).
- Un compte désactivé ne peut plus se connecter et ses sessions sont fermées.
- Un administrateur créé reçoit un mot de passe provisoire à changer à la première connexion.

---

## 3. Besoins fonctionnels

### 3.1 Connexion et installation

- Connexion par **identifiant** (3 à 50 caractères `a-z 0-9 . - _`) et mot de passe.
- Limitation : 5 tentatives par minute et par adresse IP.
- Pas d'inscription libre : les comptes sont créés par un administrateur.
- Changement de mot de passe : ferme toutes les sessions et renvoie à la connexion.
- **Première installation** : tant qu'aucun utilisateur n'existe, `pstime` + mot de passe du jour ouvre une fenêtre de création du premier super administrateur (jeton à usage unique de 10 minutes, 30 essais par jour au total).

### 3.2 Tableau de bord

- Bannière d'accueil avec horloge (fuseau Africa/Casablanca) et date.
- Cartes chiffrées (personnes, départements, postes) selon les pages accordées.
- **Statistiques de présence** sur 7, 14 ou 30 jours, calculées sur les vrais pointages :
  - six chiffres clés (présents aujourd'hui, retards, absents, taux de présence, heures travaillées sur prévues, heures supplémentaires) ;
  - huit graphiques (présence par jour, répartition du jour, heures, départements, retards, motifs d'absence, jour de la semaine, arrivées par heure) avec tableau « Voir les valeurs ».

### 3.3 Module Personnel

| Écran | Fonctions attendues |
| --- | --- |
| Sites | Liste, création, modification, suppression (refusée si le site est utilisé) |
| Départements | Arbre parent / enfants, recherche, nombre d'employés, CRUD en fenêtre |
| Postes | Arbre, numéro unique, recherche, CRUD en fenêtre |
| Personnes | Liste paginée et filtrée (nom, matricule, badge, département), fiche, création, modification, suppression ; onglets Identité, Emploi, Informations supplémentaires, Pointage à distance, Visage et empreintes ; photo facultative ; export Excel et PDF |

### 3.4 Module Planning

1. **Profils horaires** : journée de 00:00 à 24:00 découpée en plages (Fixe, Variable, Repas, Retard toléré, Neutralisée, Interdite), barre de 24 h, théorique calculé.
2. **Rotations** : semaine type ou cycle de 1 à 31 jours, un profil par jour.
3. **Groupes** : nom, description, membres.
4. **Affectations** : une rotation pour un groupe ou un employé, sur une période ; pas de chevauchement.
5. **Horaire dynamique** : règles « premier pointage entre X et Y, tels jours : tel profil », couleur, employés concernés.
6. **Rapport des présences** : horaire reconnu par employé et par jour, filtres, export Excel et PDF.

### 3.5 Module Présence

| Écran | Fonctions attendues |
| --- | --- |
| Pointage manuel | Liste paginée, saisie pour un ou plusieurs employés (Entrée, Sortie, Pause, Heures sup.), remarque, suppression |
| Événements | Motifs d'absence ou de présence : code, libellé, type, saisie (journée, demi-journée, heures), neutralisation du pointage, soumis aux droits, actif, priorité 0 à 255, code de paie |
| Droits aux congés | Attribution par personne, groupe ou département ; reliquat, droit, suppléments, total ; confirmation ; solde bloquant ; report ; pièces justificatives ; soldes calculés à l'affichage |
| Gestion des compteurs | Compteurs par formule (Jour, Semaine, Mois), éditeur coloré, test, historique des versions, activation |
| Détail jour | Pour un employé et une date : horaire, pointages et leur origine, événement du jour, compteurs, historique 7 / 14 / 30 jours |

### 3.6 Module État

Quatre rapports, mêmes filtres (période de 93 jours au plus, département, employé), export Excel et PDF (5 000 lignes au plus) :

- Présences et retards ;
- Absences et événements ;
- Congés et soldes ;
- Pointages manuels.

### 3.7 Module Appareils

- Badgeuses : page d'attente. **À développer** : connexion aux badgeuses (ZKTeco), récupération automatique des pointages, enrôlement sur l'appareil.

### 3.8 Module Administration

| Écran | Fonctions attendues |
| --- | --- |
| Utilisateurs | Création d'administrateurs, choix des pages (« Tout », « Tout le module »), désactivation, nouveau mot de passe provisoire |
| Apparence | Thème (4 prêts ou personnalisé, contraste vérifié), police (4 au choix), taille du texte |
| Historique | Toutes les actions de tous les comptes, filtres, frise par jour, conservation 365 jours |
| Sauvegarde | Export `.sql` signé, import contrôlé (fichier signé, même version, mot « IMPORTER »), sauvegarde automatique avant import |

### 3.9 Notifications

- Cloche avec le nombre d'actions non lues des autres comptes, limitée aux pages accordées, actualisée toutes les 30 secondes, conservation 90 jours.

---

## 4. Règles métier

### 4.1 Calcul d'un pointage

- Le résultat (à l'heure, retard, départ anticipé, retard toléré, hors limite...) est **calculé à l'affichage** d'après le planning, jamais stocké.
- Ordre de recherche de l'horaire : horaire dynamique (si une seule règle reconnaît le premier pointage), sinon affectation de l'employé, sinon celle de son groupe.
- Point validé : heure réelle dans une plage fixe, sinon borne de la plage fixe voisine.
  Exemple : réel 07:30 / 12:00 / 13:30 / 19:00 donne validé 08:00 / 12:00 / 14:00 / 18:00.

### 4.2 Événements

- Un pointage l'emporte sur un événement, sauf si l'événement **neutralise le pointage**.
- Entre plusieurs événements le même jour, la plus grande priorité l'emporte ; les autres sont « non validés ».
- Un événement d'absence en journée entière donne « Absence justifiée » (hors taux de présence).

### 4.3 Droits aux congés

- Reste = reliquat + droit + suppléments + report − pris − prévus.
- Seuls les jours de travail prévus au planning sont décomptés.
- Un droit bloquant refuse une absence qui rendrait le solde négatif.
- Report automatique du solde positif vers la période suivante si « Report : oui ».

### 4.4 Compteurs

- Petit langage de formules (`+ - * /`, comparaisons, `IF`, `MIN`, `MAX`, `ROUND`, `COALESCE`...), jamais exécuté comme du code.
- Une donnée manquante n'est **jamais** remplacée par 0.
- Valeurs calculées à la demande, jamais stockées.

### 4.5 Règles générales

- Fuseau horaire de référence : **Africa/Casablanca** ; stockage en UTC.
- Pas de pointage dans le futur (5 minutes de marge).
- Heures au format 24 h, dates lisibles (« mer. 25 nov. 2026 »).

---

## 5. Besoins non fonctionnels

### 5.1 Sécurité

- Authentification éprouvée (Better Auth), mots de passe hachés (scrypt), session en cookie httpOnly.
- Droits vérifiés au début de chaque action serveur et de chaque route.
- Toute entrée validée côté serveur (zod) ; requêtes paramétrées uniquement.
- Fichiers envoyés vérifiés par leur signature (type et taille).
- Deux comptes de base : application (lecture / écriture) et propriétaire (migrations).
- En-têtes de sécurité, HTTPS en production.
- **À faire avant la production** : double authentification (MFA) des administrateurs.

### 5.2 Données personnelles (loi 09-08)

- Minimisation : pas de date de naissance, aucune donnée biométrique stockée.
- Pièce d'identité réservée au super administrateur, jamais dans les journaux.
- Déclaration ou autorisation **CNDP** avant la mise en production avec de vraies données.
- Exceptions acceptées et documentées : pièce d'identité (CNSS), genre, photo de profil.

### 5.3 Traçabilité

- Historique de toutes les actions (création, modification, suppression, connexion, déconnexion, export) conservé 365 jours.
- Chaque export tracé (utilisateur, format, nombre de lignes, période).

### 5.4 Performance et limites

- Listes paginées (50 lignes) ; exports limités (5 000 à 10 000 lignes).
- Statistiques : 2 000 employés au plus, chargées sans bloquer le reste de la page.
- Périodes limitées (93 jours pour les états, 366 jours pour l'historique).

### 5.5 Ergonomie et accessibilité

- Interface en français, responsive (360 px, tablette, ordinateur), menu en tiroir sous 1024 px.
- Accessibilité WCAG AA : contraste 4,5:1, navigation au clavier, statuts jamais indiqués par la couleur seule.
- Pas de dégradé violet, pas de bouton en pilule, pas d'emoji comme icône.
- Respect de « réduire les animations ».

### 5.6 Sauvegarde et continuité

- Sauvegarde depuis l'application ou en ligne de commande, restauration contrôlée.
- Sauvegardes automatiques quotidiennes en production et restauration testée avant le lancement.

### 5.7 Qualité

- TypeScript strict, aucun `any`, lint et build sans erreur.
- Tests automatiques de la logique métier (`npm test`).

---

## 6. Architecture technique

| Couche | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Interface | Tailwind CSS v4, icônes Lucide |
| Base de données | PostgreSQL 13+, une base par client, serveur séparé, SSL |
| Accès aux données | Drizzle ORM (pilote `pg`), côté serveur uniquement |
| Authentification | Better Auth (identifiant + mot de passe) |
| Validation | zod |
| Exports | exceljs (Excel), pages imprimables (PDF) |
| Hébergement | **À préciser** |

Organisation du code : interface (`app/`, `components/`), accès aux données (`lib/donnees/`), logique métier pure et testée (`lib/metier/`).

---

## 7. Modèle de données

Tables principales (détail dans `src/lib/donnees/schema.ts`) :

| Domaine | Tables |
| --- | --- |
| Comptes | `utilisateurs`, `comptes`, `sessions`, `verifications`, `autorisations_pages` |
| Personnel | `sites`, `departements`, `postes`, `employes`, `photos_employes`, `informations_employes` |
| Planning | `profils_horaires`, `plages_profils`, `rotations`, `jours_rotation`, `groupes`, `affectations`, `regles_horaires` |
| Présence | `pointages`, `evenements`, `evenements_employes`, `droits_conges`, `pieces_jointes`, `droits_conges_pieces_jointes` |
| Compteurs | `compteurs`, `compteurs_versions` |
| Système | `parametres`, `notifications`, `historique` |

Principes : identifiants `uuid`, dates en `timestamptz` (UTC), contraintes `check` sur les valeurs limitées, clés étrangères avec comportement de suppression choisi, migrations versionnées.

---

## 8. Avancement et lots

| Lot | Contenu | État |
| --- | --- | --- |
| 1. Socle | Connexion, installation `pstime`, comptes et droits par page, cadre de navigation | Réalisé |
| 2. Personnel | Sites, départements, postes, personnes, exports | Réalisé |
| 3. Planning | Profils, rotations, groupes, affectations, horaire dynamique, rapport | Réalisé |
| 4. Présence | Pointage manuel, événements, droits aux congés, compteurs, détail jour | Réalisé |
| 5. États et tableau de bord | Quatre états, statistiques de présence | Réalisé |
| 6. Administration | Apparence, historique, notifications, sauvegarde | Réalisé |
| 7. Passage à PostgreSQL | Migration depuis MySQL, comptes à moindre privilège | Réalisé (25/11/2026) |
| 8. Badgeuses | Connexion aux appareils, import automatique des pointages, enrôlement | À faire |
| 9. Espace employé | Pointage à distance (PC, tablette, téléphone, position, photo) | À faire |
| 10. Mise en production | MFA, CNDP, hébergement, sauvegardes automatiques, test de bout en bout | À faire |

Fonctions de Gestor non encore reprises : valorisation et famille des événements, événements automatiques, périodicité et date limite des droits, fractionnement, service de nuit.

---

## 9. Recette et critères d'acceptation

Une fonctionnalité est acceptée quand :

- [ ] elle répond aux besoins de la section 3 et aux règles de la section 4 ;
- [ ] un compte sans la page concernée ne peut ni la voir ni appeler ses actions ;
- [ ] les erreurs sont affichées en français clair, sans détail technique ;
- [ ] les états chargement, erreur et vide sont gérés ;
- [ ] elle fonctionne sur mobile (360 px), tablette et ordinateur ;
- [ ] `npm run lint`, `npm run build` et `npm test` passent ;
- [ ] l'action est tracée dans l'historique quand elle modifie des données.

Scénarios de recette principaux :

1. Installer une base vide, créer le super administrateur avec `pstime`, se reconnecter.
2. Créer un administrateur avec seulement la page Personnes, vérifier qu'il ne voit rien d'autre.
3. Créer un profil horaire, une rotation, l'affecter à un groupe, saisir des pointages et vérifier les retards calculés.
4. Saisir un congé pour un employé qui a pointé ce jour-là, vérifier le départage.
5. Attribuer un droit bloquant, vérifier le refus d'une absence qui dépasse le solde.
6. Exporter une sauvegarde, la réimporter, vérifier les données.

---

## 10. Livrables

- Code source (dépôt Git) et fichier de verrouillage des dépendances.
- Migrations SQL et scripts d'installation (`base-de-donnees/`, `scripts/`).
- Documentation : fiche projet, guide PostgreSQL (`docs/migration-postgresql.md`), licences (`docs/licences.md`), ce cahier des charges.
- Données de test fictives (`base-de-donnees/donnees-test.sql`).
- Guide utilisateur : **À produire**.

---

## 11. Points à préciser

| Sujet | Question |
| --- | --- |
| Utilisateurs | Profils exacts des utilisateurs chez le client (RH, chefs d'équipe, direction) |
| Client | Nom du client ou du commanditaire |
| Marché | Pays et langues (français seul, arabe, anglais ?) |
| Statut | MVP ou production ? Date de mise en production visée |
| Hébergement | Serveur chez le client, cloud, Vercel ? |
| Services externes | E-mail, SMS, WhatsApp pour les notifications ? |
| Badgeuses | Modèles exacts (ZKTeco ?) et mode de communication |
| Genre et photo | Usage précis à documenter avant la production |
| Thème sombre | Souhaité ou non |
| Données sensibles | Liste définitive et précautions |

---

## 12. Glossaire

| Terme | Définition |
| --- | --- |
| Pointage | Enregistrement d'un passage (entrée, sortie, pause, heures sup.) à une heure donnée |
| Profil horaire | Modèle d'une journée découpée en plages (fixe, variable, repas...) |
| Rotation | Suite de profils horaires sur une semaine ou un cycle |
| Affectation | Lien entre une rotation et un groupe ou un employé, sur une période |
| Horaire dynamique | Profil choisi automatiquement selon l'heure du premier pointage |
| Événement | Motif d'absence ou de présence (congé, maladie, mission...) |
| Droit aux congés | Nombre de jours ou d'heures attribués à un employé pour un événement sur une période |
| Reliquat | Solde restant d'une période précédente |
| Compteur | Indicateur calculé par une formule (jour, semaine, mois) |
| Neutraliser le pointage | L'événement reste retenu même si l'employé a pointé |
