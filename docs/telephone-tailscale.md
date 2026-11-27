# Application sur le téléphone, toujours disponible (test local avec Tailscale)

But : ouvrir PS Time depuis l'icône du téléphone (Wi-Fi ou 4G), sans rien lancer à la main, tant que le PC est allumé.
Le PC sert de serveur. Pour un fonctionnement 24 h/24, il faudra un vrai serveur (hébergement).

## Pourquoi Tailscale

- Adresse **fixe** du PC : `https://<nom-du-pc>.<reseau>.ts.net`. L'icône installée ne casse plus quand l'IP change.
- **Vrai certificat HTTPS** : le téléphone installe une vraie application (plein écran), la position et la caméra marchent sans avertissement.
- Seuls les appareils connectés au même compte Tailscale y accèdent (pas ouvert sur internet).

## Mise en place (une seule fois)

1. PC : installer Tailscale (`winget install Tailscale.Tailscale`) et se connecter.
2. Téléphone : installer l'application Tailscale et se connecter avec **le même compte**.
3. Console Tailscale (https://login.tailscale.com/admin/dns) : activer **MagicDNS** et **HTTPS Certificates**, puis **Serve** (lien affiché par `tailscale serve` la première fois).
4. `.env.production.local` (jamais dans Git) : `BETTER_AUTH_URL=https://<nom-du-pc>.<reseau>.ts.net` et `BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3100`. Ces valeurs remplacent celles de `.env.local` pour le seul serveur permanent ; `npm run dev` garde les siennes.
5. `npm run build`, puis `.\scripts\serveur-local.ps1 -Installer` (PowerShell) : tâche planifiée « PS Time - serveur local », lancée à chaque ouverture de session Windows, relancée si elle s'arrête. Elle démarre `npm run serveur:local` (`next start` sur `127.0.0.1:3100`, port différent de `npm run dev`) et `tailscale serve --bg 3100` (HTTPS de Tailscale vers ce port).
6. Téléphone : ouvrir l'adresse `https://<nom-du-pc>.<reseau>.ts.net` dans Chrome (Android) ou Safari (iPhone), puis « Ajouter à l'écran d'accueil » / « Installer l'application ». L'icône ouvre Mon pointage.

## Au quotidien

- Après une modification du code : `.\scripts\serveur-local.ps1 -MettreAJour` (reconstruit puis relance).
- Journal du serveur : `%LOCALAPPDATA%\ps-time\serveur.log`.
- Retirer le démarrage automatique : `.\scripts\serveur-local.ps1 -Desinstaller`.
- Le PC doit être allumé, session ouverte, et ne pas se mettre en veille (Paramètres > Système > Alimentation).
- Le PC ouvre aussi l'application par la même adresse `.ts.net` (recommandé), ou par `http://localhost:3100`.
