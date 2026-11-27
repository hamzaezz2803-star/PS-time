"use client";

import { useState, useTransition } from "react";
import { Clock, Fingerprint, FlaskConical, LoaderCircle, RefreshCw, ScanLine, ShieldAlert, Unplug, Wifi } from "lucide-react";
import { synchroniserUneBadgeuse, verifierBadgeuse } from "@/app/(connecte)/appareils/actions";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { Pastille } from "@/components/ui/pastille";
import { ECART_HEURE_TOLERE_SECONDES, FUSEAU_HORAIRE } from "@/lib/constantes";
import { formaterHeure } from "@/lib/formats";
import { etatHeure, type EtatBadgeuse, type StatutBadgeuse } from "@/lib/metier/badgeuses/etat";
import { synchroniserExemple } from "@/lib/metier/badgeuses/exemple";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";

const textes = TEXTES_APPAREILS;

const PASTILLES_STATUT = {
  en_ligne: { ton: "succes", Icone: Wifi },
  protegee: { ton: "attention", Icone: ShieldAlert },
  injoignable: { ton: "erreur", Icone: Unplug },
  non_reconnue: { ton: "neutre", Icone: ScanLine },
} as const satisfies Record<StatutBadgeuse, { ton: string; Icone: unknown }>;

const TONS_HEURE = { a_l_heure: "succes", a_regler: "attention", inconnue: "neutre" } as const;

type Retour = { reussi: boolean; message: string } | null;

/** Une badgeuse détectée : identité, état lu sur le réseau, vérification et synchronisation. */
export function CarteBadgeuse({
  badgeuse,
  surMiseAJour,
  estExemple = false,
}: {
  badgeuse: EtatBadgeuse;
  surMiseAJour: (etat: EtatBadgeuse) => void;
  /** Badgeuse d'exemple : les boutons montrent le résultat sans rien envoyer au serveur. */
  estExemple?: boolean;
}) {
  const [enCours, demarrer] = useTransition();
  const [operation, setOperation] = useState<"verifier" | "synchroniser" | null>(null);
  const [retour, setRetour] = useState<Retour>(null);
  const statut = PASTILLES_STATUT[badgeuse.statut];
  const heure = etatHeure(badgeuse.ecartSecondes, ECART_HEURE_TOLERE_SECONDES);
  const titre = badgeuse.nom ?? textes.liste.sansNom;

  const lancerExemple = (choix: "verifier" | "synchroniser") => {
    setOperation(choix);
    if (choix === "verifier") return setRetour({ reussi: true, message: textes.exemple.verifiee });
    const synchronisee = synchroniserExemple(badgeuse, new Date(), FUSEAU_HORAIRE);
    surMiseAJour(synchronisee);
    setRetour({ reussi: true, message: textes.exemple.synchronisee(textes.heureLisible(synchronisee.heureAppareil ?? "")) });
  };

  const lancer = (choix: "verifier" | "synchroniser") => {
    if (estExemple) return lancerExemple(choix);
    setOperation(choix);
    setRetour(null);
    demarrer(async () => {
      try {
        if (choix === "verifier") {
          const resultat = await verifierBadgeuse(badgeuse.adresse);
          if (!resultat.ok) return setRetour({ reussi: false, message: resultat.erreur });
          surMiseAJour(resultat.donnees);
          const enLigne = resultat.donnees.statut === "en_ligne";
          setRetour({ reussi: enLigne, message: enLigne ? textes.messages.verifiee : textes.explicationsStatut[resultat.donnees.statut] });
        } else {
          const resultat = await synchroniserUneBadgeuse(badgeuse.adresse);
          if (!resultat.ok) return setRetour({ reussi: false, message: resultat.erreur });
          surMiseAJour(resultat.donnees.etat);
          setRetour({ reussi: resultat.donnees.reussi, message: resultat.donnees.message });
        }
      } catch {
        setRetour({ reussi: false, message: textes.messages.echec });
      }
    });
  };

  return (
    <li aria-busy={enCours} className="flex flex-col gap-4 rounded-lg border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ciel text-primaire">
            <Fingerprint className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-marine">{titre}</h3>
            <p className="font-mono text-sm tabular-nums text-texte-secondaire">{badgeuse.adresse}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {estExemple && (
            <Pastille ton="info" Icone={FlaskConical}>
              {textes.exemple.pastille}
            </Pastille>
          )}
          <Pastille ton={statut.ton} Icone={statut.Icone}>
            {textes.statuts[badgeuse.statut]}
          </Pastille>
        </div>
      </div>

      {badgeuse.statut === "en_ligne" ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm min-[420px]:grid-cols-2">
          <Information libelle={textes.liste.numeroSerie} valeur={badgeuse.numeroSerie} chasseFixe />
          <Information libelle={textes.liste.version} valeur={badgeuse.version} />
          <Information libelle={textes.liste.utilisateurs} valeur={badgeuse.utilisateurs === null ? null : textes.liste.nombre(badgeuse.utilisateurs)} />
          <Information libelle={textes.liste.pointages} valeur={badgeuse.pointages === null ? null : textes.liste.nombre(badgeuse.pointages)} />
          <div className="flex flex-col gap-1 min-[420px]:col-span-2">
            <dt className="text-texte-secondaire">{textes.liste.heure}</dt>
            <dd className="flex flex-wrap items-center gap-2 text-texte">
              <span className="tabular-nums">{badgeuse.heureAppareil ? textes.heureLisible(badgeuse.heureAppareil) : textes.liste.nonLu}</span>
              <Pastille ton={TONS_HEURE[heure]} Icone={Clock}>
                {textes.heures[heure]}
              </Pastille>
              {badgeuse.ecartSecondes !== null && heure === "a_regler" && <span className="text-texte-secondaire">({textes.ecart(badgeuse.ecartSecondes)})</span>}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-texte-secondaire">{textes.explicationsStatut[badgeuse.statut]}</p>
      )}

      <div className="flex flex-col gap-3 border-t border-bordure pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Bouton variante="contour" onClick={() => lancer("synchroniser")} disabled={enCours || badgeuse.statut === "non_reconnue"} title={textes.actions.aideSynchroniser} className="flex-1 sm:flex-none">
            {enCours && operation === "synchroniser" ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            {enCours && operation === "synchroniser" ? textes.actions.synchronisation : textes.actions.synchroniser}
          </Bouton>
          <Bouton variante="fantome" onClick={() => lancer("verifier")} disabled={enCours} className="flex-1 sm:flex-none">
            {enCours && operation === "verifier" ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Wifi className="size-4" aria-hidden="true" />}
            {enCours && operation === "verifier" ? textes.actions.verification : textes.actions.verifier}
          </Bouton>
          <span className="w-full text-sm text-texte-secondaire sm:ms-auto sm:w-auto">{textes.liste.verifieLe(formaterHeure(new Date(badgeuse.verifieLe)))}</span>
        </div>
        <div aria-live="polite">
          {retour?.reussi && <MessageSucces message={retour.message} />}
          {retour && !retour.reussi && <MessageErreur message={retour.message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />}
        </div>
      </div>
    </li>
  );
}

function Information({ libelle, valeur, chasseFixe = false }: { libelle: string; valeur: string | null; chasseFixe?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-texte-secondaire">{libelle}</dt>
      <dd className={chasseFixe ? "break-all font-mono tabular-nums text-texte" : "text-texte"}>{valeur ?? textes.liste.nonLu}</dd>
    </div>
  );
}
