# Serveur local toujours disponible (test sur téléphone avec Tailscale) : voir docs/telephone-tailscale.md.
#   .\scripts\serveur-local.ps1 -Installer     démarrage automatique à l'ouverture de session Windows, puis lancement
#   .\scripts\serveur-local.ps1 -Desinstaller  retire le démarrage automatique et arrête le serveur
#   .\scripts\serveur-local.ps1 -MettreAJour   reconstruit l'application et relance le serveur (après une modification du code)
#   .\scripts\serveur-local.ps1                lance le serveur (utilisé par la tâche planifiée)
param([switch]$Installer, [switch]$Desinstaller, [switch]$MettreAJour)

$ErrorActionPreference = "Stop"
$NomTache = "PS Time - serveur local"
$Projet = Split-Path -Parent $PSScriptRoot
$DossierJournal = Join-Path $env:LOCALAPPDATA "ps-time"
$Journal = Join-Path $DossierJournal "serveur.log"
$Tailscale = "C:\Program Files\Tailscale\tailscale.exe"

function Lancer-Serveur {
  New-Item -ItemType Directory -Force $DossierJournal | Out-Null
  Set-Location $Projet
  # HTTPS public du PC sur Tailscale -> http://127.0.0.1:3100 (réglage gardé après un redémarrage).
  # Lancé à part : tant que Serve n'est pas activé sur le compte Tailscale, la commande attend.
  if (Test-Path $Tailscale) { Start-Process $Tailscale -ArgumentList "serve", "--bg", "3100" -WindowStyle Hidden }
  & npm.cmd run serveur:local *>> $Journal
}

# Arrêter la tâche ne suffit pas : le processus node qu'elle a lancé garderait le port 3100.
function Arreter-Serveur {
  Stop-ScheduledTask -TaskName $NomTache -ErrorAction SilentlyContinue
  Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

if ($Desinstaller) {
  Arreter-Serveur
  Unregister-ScheduledTask -TaskName $NomTache -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Démarrage automatique retiré."
  exit 0
}

if ($Installer) {
  $action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -WorkingDirectory $Projet
  $declencheur = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  # Relance si le serveur s'arrête ; pas de limite de durée ; démarre aussi sur batterie.
  $reglages = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Arreter-Serveur
  Register-ScheduledTask -TaskName $NomTache -Action $action -Trigger $declencheur -Settings $reglages -Force | Out-Null
  Start-ScheduledTask -TaskName $NomTache
  Write-Output "Installé : le serveur démarre à chaque ouverture de session. Journal : $Journal"
  exit 0
}

if ($MettreAJour) {
  Arreter-Serveur
  Set-Location $Projet
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { Write-Error "Échec de la construction : le serveur n'est pas relancé." }
  Start-ScheduledTask -TaskName $NomTache
  Write-Output "Application reconstruite et serveur relancé."
  exit 0
}

Lancer-Serveur
