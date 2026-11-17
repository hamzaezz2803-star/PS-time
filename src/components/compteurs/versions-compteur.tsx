"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { chargerVersionsCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { Pastille } from "@/components/ui/pastille";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import { TEXTES_PERIODICITES } from "@/lib/textes/variables-compteurs";
import type { VersionCompteur } from "@/types";

const textes = TEXTES_COMPTEURS.versions;
type Etat = { type: "chargement" } | { type: "erreur" } | { type: "pret"; versions: VersionCompteur[] };

/** Historique des versions d'un compteur (piste d'audit), chargé à l'ouverture. */
export function VersionsCompteur({ compteurId, versionActuelle }: { compteurId: string; versionActuelle: number }) {
  const [etat, setEtat] = useState<Etat>({ type: "chargement" });

  useEffect(() => {
    let estAbandonne = false;
    chargerVersionsCompteur(compteurId).then(
      (resultat) => {
        if (!estAbandonne) setEtat(resultat.ok ? { type: "pret", versions: resultat.versions } : { type: "erreur" });
      },
      () => {
        if (!estAbandonne) setEtat({ type: "erreur" });
      },
    );
    return () => {
      estAbandonne = true;
    };
  }, [compteurId, versionActuelle]);

  return (
    <details className="rounded-lg border border-bordure bg-surface">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-base font-medium text-marine focus-visible:outline-2 focus-visible:outline-primaire">
        <History className="size-4 text-primaire" aria-hidden="true" />
        {textes.titre}
      </summary>
      <div className="border-t border-bordure p-3.5">
        {etat.type === "chargement" && <Chargement message={textes.chargement} />}
        {etat.type === "erreur" && <MessageErreur message={textes.erreur} />}
        {etat.type === "pret" && (
          <ol className="flex flex-col gap-3">
            {etat.versions.map((version) => (
              <li key={version.version} className="flex flex-col gap-1.5 border-s-2 border-bordure ps-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-texte">{textes.version(version.version)}</span>
                  {version.version === versionActuelle && <Pastille ton="succes">{textes.actuelle}</Pastille>}
                  <span className="text-texte-secondaire tabular-nums">
                    {formaterDate(new Date(version.date))} {formaterHeure(new Date(version.date))}, {textes.par(version.auteur ?? textes.auteurInconnu)}
                  </span>
                </div>
                <code className="block whitespace-pre-wrap break-words rounded-md bg-fond px-2.5 py-1.5 font-mono text-sm text-texte">{version.formule}</code>
                <span className="text-sm text-texte-secondaire">
                  {version.periodicites.map((periodicite) => TEXTES_PERIODICITES[periodicite]).join(" · ")} · {version.unite}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
