"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, KeyRound, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";
import { lireNotifications, marquerLues, type EtatNotifications } from "@/lib/actions/notifications";
import { CONSERVATION_NOTIFICATIONS_JOURS, INTERVALLE_NOTIFICATIONS_MS } from "@/lib/constantes";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { TEXTES_NOTIFICATIONS as textes } from "@/lib/textes/notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const MILLISECONDES_PAR_MINUTE = 60_000;
const MINUTES_PAR_JOUR = 1440;
/** Au-delà de 99, la pastille affiche « 99+ ». */
const PASTILLE_MAX = 99;

const ICONES: Record<Notification["action"], { Icone: LucideIcon; teinte: string }> = {
  creation: { Icone: Plus, teinte: "bg-succes/10 text-succes" },
  modification: { Icone: Pencil, teinte: "bg-ciel text-primaire" },
  suppression: { Icone: Trash2, teinte: "bg-erreur/10 text-erreur" },
};

/** « il y a 5 min », puis la date et l'heure au-delà d'un jour. */
function quand(date: Date, maintenant: number): string {
  const minutes = Math.max(0, Math.floor((maintenant - date.getTime()) / MILLISECONDES_PAR_MINUTE));
  return minutes < MINUTES_PAR_JOUR ? textes.ilYA(minutes) : `${formaterDate(date)} · ${formaterHeure(date)}`;
}

function Element({ notification, estNouvelle, estDeMoi, maintenant, onOuvrir }: { notification: Notification; estNouvelle: boolean; estDeMoi: boolean; maintenant: number; onOuvrir: () => void }) {
  const { Icone, teinte } = notification.objet === "mot_de_passe" ? { Icone: KeyRound, teinte: "bg-ciel text-primaire" } : ICONES[notification.action];
  const contenu = (
    <>
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", teinte)}>
        <Icone className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm text-texte">{textes.phrase(notification, estDeMoi ? textes.vous : notification.auteurNom)}</span>
        <span className="text-sm text-texte-secondaire">{quand(notification.creeLe, maintenant)}</span>
      </span>
      {estNouvelle && (
        <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold text-primaire ring-1 ring-inset ring-primaire/30">{textes.nouveau}</span>
      )}
    </>
  );
  const classe = cn("flex items-start gap-3 px-4 py-3", estNouvelle && "bg-ciel/50");
  return (
    <li>
      {notification.lien ? (
        <Link href={notification.lien} onClick={onOuvrir} className={cn(classe, "hover:bg-fond focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primaire")}>
          {contenu}
        </Link>
      ) : (
        <div className={classe}>{contenu}</div>
      )}
    </li>
  );
}

/**
 * Cloche de la barre du haut : vraies notifications (chaque action dans les modules du compte),
 * actualisées toutes les 30 secondes. Ouvrir le panneau marque tout comme lu.
 */
export function Notifications() {
  const { estOuvert, basculer, conteneur } = useMenuDeroulant();
  const [etat, setEtat] = useState<EtatNotifications | null>(null);
  const [aUneErreur, setAUneErreur] = useState(false);
  const [maintenant, setMaintenant] = useState(0);
  // Notifications « nouvelles » au moment de l'ouverture (encore signalées pendant la lecture).
  const [nouvellesALOuverture, setNouvellesALOuverture] = useState(0);

  useEffect(() => {
    let estActif = true;
    const actualiser = async () => {
      if (document.visibilityState !== "visible") return;
      const resultat = await lireNotifications();
      if (!estActif) return;
      setAUneErreur(!resultat.ok);
      if (resultat.ok) setEtat(resultat.donnees);
      setMaintenant(Date.now());
    };
    void actualiser();
    const minuterie = setInterval(actualiser, INTERVALLE_NOTIFICATIONS_MS);
    return () => {
      estActif = false;
      clearInterval(minuterie);
    };
  }, []);

  const nonLues = etat?.nonLues ?? 0;
  const ouvrir = () => {
    if (!estOuvert && nonLues > 0) {
      setNouvellesALOuverture(nonLues);
      setEtat((actuel) => (actuel ? { ...actuel, nonLues: 0 } : actuel));
      void marquerLues();
    }
    setMaintenant(Date.now());
    basculer();
  };

  const notifications = etat?.notifications ?? [];
  // Les nouvelles sont les plus récentes des autres comptes, dans l'ordre de la liste.
  const idsNouvelles = new Set(
    notifications
      .filter((notification) => notification.auteurId !== etat?.idConnecte)
      .slice(0, nouvellesALOuverture)
      .map((notification) => notification.id),
  );

  return (
    <div ref={conteneur} className="relative">
      <button
        type="button"
        onClick={ouvrir}
        aria-expanded={estOuvert}
        aria-controls="panneau-notifications"
        aria-label={nonLues > 0 ? textes.ouvrirNonLues(nonLues) : textes.ouvrir}
        title={textes.ouvrir}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-lg text-texte-secondaire transition-colors duration-150 hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire lg:size-9",
          estOuvert && "bg-canevas text-texte",
        )}
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {nonLues > 0 && (
          <span className="absolute end-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erreur px-1 text-[11px] font-bold leading-none tabular-nums text-white ring-2 ring-surface lg:-end-1 lg:-top-1" aria-hidden="true">
            {nonLues > PASTILLE_MAX ? `${PASTILLE_MAX}+` : nonLues}
          </span>
        )}
      </button>
      {estOuvert && (
        <div
          id="panneau-notifications"
          className="absolute end-0 top-full z-40 mt-2 flex max-h-[70vh] w-96 max-w-[calc(100vw-1rem)] animate-apparition flex-col overflow-hidden rounded-xl bg-surface shadow-flottant ring-1 ring-bordure motion-reduce:animate-none"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-bordure px-4 py-3">
            <p className="text-sm font-semibold text-marine">{textes.titre}</p>
            <p className="text-sm text-texte-secondaire">{textes.nonLues(nouvellesALOuverture)}</p>
          </div>
          {aUneErreur && <p role="alert" className="border-b border-bordure px-4 py-2 text-sm text-erreur">{textes.erreur}</p>}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-canevas text-texte-secondaire">
                <BellOff className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-texte">{textes.vide}</p>
              <p className="text-sm text-texte-secondaire">{textes.aide}</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-bordure overflow-y-auto">
              {notifications.map((notification) => (
                <Element
                  key={notification.id}
                  notification={notification}
                  estNouvelle={idsNouvelles.has(notification.id)}
                  estDeMoi={notification.auteurId === etat?.idConnecte}
                  maintenant={maintenant}
                  onOuvrir={basculer}
                />
              ))}
            </ul>
          )}
          <p className="border-t border-bordure px-4 py-2 text-xs text-texte-secondaire">{textes.aideConservation(CONSERVATION_NOTIFICATIONS_JOURS)}</p>
        </div>
      )}
    </div>
  );
}
