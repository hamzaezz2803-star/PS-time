import { CalendarCheck, Clock, Coffee, Fingerprint, type LucideIcon } from "lucide-react";
import { TEXTES_ESPACE } from "@/lib/textes/espace";

/** Petite pastille d'icône placée autour de l'empreinte. */
function Pastille({ Icone, position }: { Icone: LucideIcon; position: string }) {
  return (
    <span className={`absolute flex size-10 items-center justify-center rounded-lg bg-surface text-primaire shadow-survol ring-1 ring-bordure ${position}`}>
      <Icone className="size-5" />
    </span>
  );
}

/** Illustration décorative : empreinte (badgeuse) entourée des moments de la journée. */
function IllustrationPointage() {
  return (
    <div className="relative hidden size-52 shrink-0 md:block" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border border-primaire/10" />
      <span className="absolute inset-6 rounded-full border border-primaire/15" />
      <span className="absolute inset-12 rounded-full border border-dashed border-primaire/25" />
      <span className="absolute inset-[4.25rem] flex items-center justify-center rounded-xl bg-primaire text-white shadow-survol">
        <Fingerprint className="size-9" strokeWidth={1.75} />
      </span>
      <Pastille Icone={Clock} position="end-2 top-6" />
      <Pastille Icone={CalendarCheck} position="start-0 top-24" />
      <Pastille Icone={Coffee} position="bottom-3 end-10" />
    </div>
  );
}

/** Accueil du tableau de bord : salutation, phrase d'appui et illustration. */
export function BanniereAccueil({ nom }: { nom: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-primaire/15 bg-ciel shadow-carte">
      <div className="flex items-center justify-between gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primaire">{TEXTES_ESPACE.surtitre}</p>
          <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-3xl">{TEXTES_ESPACE.bonjour(nom)}</h1>
          <p className="text-base leading-relaxed text-texte-secondaire">{TEXTES_ESPACE.introduction}</p>
        </div>
        <IllustrationPointage />
      </div>
    </section>
  );
}
