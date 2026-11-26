import type { ReactNode } from "react";
import { formaterJour } from "@/lib/formats";
import { formaterTelephone } from "@/lib/metier/employes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { TEXTES_SITES } from "@/lib/textes/sites";
import type { EmployeDetail } from "@/types";
import { AvatarEmploye } from "./avatar-employe";
import { nomDoigt } from "./nom-doigt";

const { formulaire: textes, details, liste, acces } = TEXTES_PERSONNES;

/** « Autorisé : Ordinateur (PC), Tablette · pointages : P. Présence, P. Mission · position exigée », ou « Non autorisé... ». */
function resumeDistance({ acces: valeur }: EmployeDetail): string {
  if (!valeur.pointageDistance) return acces.nonAutorise;
  const appareils = valeur.appareils.map((appareil) => acces.nomsAppareils[appareil]).join(", ");
  const droits = [acces.presence, ...valeur.droits.map((droit) => acces.nomsDroits[droit])].join(", ");
  return [acces.resumeDistance(appareils), acces.resumeDroits(droits), valeur.exigePosition && acces.resumePosition, valeur.exigePhoto && acces.resumePhoto]
    .filter(Boolean)
    .join(" · ");
}

/** Libellé lisible d'une valeur codée (« cdi » donne « CDI »), ou la valeur telle quelle. */
function libelleDe(libelles: Record<string, string>, valeur: string | null): string | null {
  return valeur === null ? null : (libelles[valeur] ?? valeur);
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-marine">{titre}</h3>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Element({ libelle, valeur }: { libelle: string; valeur: ReactNode | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-bordure pb-2">
      <dt className="text-sm text-texte-secondaire">{libelle}</dt>
      <dd className="text-base text-texte">
        {valeur ?? <span className="text-texte-secondaire">{liste.nonRenseigne}</span>}
      </dd>
    </div>
  );
}

/** Fiche en lecture seule, regroupée comme le formulaire. */
export function FicheEmploye({ employe }: { employe: EmployeDetail }) {
  const typePiece = libelleDe(textes.typesPiece, employe.typePieceIdentite);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-xl border border-bordure bg-fond/60 p-4">
        <AvatarEmploye id={employe.id} nomComplet={`${employe.prenom} ${employe.nom}`} photoModifieeLe={employe.photoModifieeLe} taille="grande" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-marine">{`${employe.prenom} ${employe.nom}`}</p>
          <p className="truncate text-sm text-texte-secondaire">{[employe.poste, employe.departement].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 font-mono text-sm tabular-nums text-texte-secondaire">{employe.matricule}</p>
        </div>
      </div>
      <Section titre={textes.sectionPrincipale}>
        <Element libelle={textes.matricule} valeur={<span className="tabular-nums">{employe.matricule}</span>} />
        <Element libelle={textes.numeroBadge} valeur={<span className="tabular-nums">{employe.numeroBadge}</span>} />
        <Element libelle={textes.prenom} valeur={employe.prenom} />
        <Element libelle={textes.nom} valeur={employe.nom} />
        <Element libelle={TEXTES_SITES.champ.libelle} valeur={employe.site} />
        <Element libelle={textes.departement} valeur={employe.departement} />
        <Element libelle={textes.poste} valeur={employe.poste} />
      </Section>
      <Section titre={textes.ongletIdentiteContact}>
        <Element libelle={textes.genre} valeur={libelleDe(textes.genres, employe.genre)} />
        <Element libelle={textes.typePiece} valeur={typePiece && `${typePiece} ${employe.numeroPieceIdentite ?? ""}`.trim()} />
        <Element libelle={textes.telephone} valeur={employe.telephone && formaterTelephone(employe.telephone)} />
        <Element libelle={textes.email} valeur={employe.email} />
      </Section>
      <Section titre={textes.ongletEmploi}>
        <Element libelle={textes.typeEmploi} valeur={libelleDe(textes.typesEmploi, employe.typeEmploi)} />
        <Element libelle={textes.dateEmbauche} valeur={employe.dateEmbauche && formaterJour(employe.dateEmbauche)} />
        <Element libelle={textes.dateDebutEmploi} valeur={employe.dateDebutEmploi && formaterJour(employe.dateDebutEmploi)} />
        <Element libelle={textes.dateFinEmploi} valeur={employe.dateFinEmploi && formaterJour(employe.dateFinEmploi)} />
      </Section>
      <Section titre={textes.ongletDistance}>
        <Element libelle={textes.ongletDistance} valeur={resumeDistance(employe)} />
        <Element libelle={acces.compte} valeur={employe.compte && [acces.compteActif(employe.compte.identifiant), employe.compte.motDePasseProvisoire && acces.compteProvisoire].filter(Boolean).join(" · ")} />
      </Section>
      <Section titre={textes.ongletBiometrie}>
        <Element libelle={acces.empreintes} valeur={employe.acces.doigts.length > 0 ? employe.acces.doigts.map(nomDoigt).join(", ") : null} />
      </Section>
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-marine">{textes.ongletInformations}</h3>
        {employe.informations.length === 0 ? (
          <p className="text-sm text-texte-secondaire">{details.aucuneInformation}</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {employe.informations.map((information) => (
              <Element key={information.libelle} libelle={information.libelle} valeur={information.valeur} />
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
