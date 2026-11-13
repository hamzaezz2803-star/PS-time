import type { CSSProperties } from "react";
import {
  CalendarCheck,
  ChartColumn,
  Clock,
  Coffee,
  Fingerprint,
  LogIn,
  Timer,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Anneau = {
  rayon: number;
  dureeSecondes: number;
  inverse?: boolean;
  icones: LucideIcon[];
};

/** Thèmes du pointage : heures, pauses, équipes, planning, statistiques, paie. */
const ANNEAUX: Anneau[] = [
  { rayon: 135, dureeSecondes: 32, icones: [Clock, Coffee, Fingerprint] },
  {
    rayon: 210,
    dureeSecondes: 44,
    inverse: true,
    icones: [Users, CalendarCheck, Timer],
  },
  { rayon: 285, dureeSecondes: 56, icones: [ChartColumn, Wallet, LogIn] },
];

function IconeEnOrbite({
  Icone,
  anneau,
  position,
}: {
  Icone: LucideIcon;
  anneau: Anneau;
  position: number;
}) {
  const fraction = position / anneau.icones.length;
  const angleDepart = fraction * 360;

  // La position statique sert quand les animations sont désactivées ;
  // le délai négatif fait partir l'animation du même angle.
  const style = {
    "--rayon": anneau.rayon,
    "--duree": anneau.dureeSecondes,
    transform: `rotate(${angleDepart}deg) translateY(${anneau.rayon}px) rotate(-${angleDepart}deg)`,
    animationDelay: `-${fraction * anneau.dureeSecondes}s`,
    animationDirection: anneau.inverse ? "reverse" : "normal",
  } as CSSProperties;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        className="flex size-12 animate-orbite items-center justify-center rounded-xl bg-white text-primaire shadow-lg shadow-black/20 motion-reduce:animate-none"
        style={style}
      >
        <Icone className="size-6" strokeWidth={1.75} />
      </span>
    </div>
  );
}

/** Icônes liées au pointage qui tournent autour du logo. Purement décoratif. */
export function OrbiteIcones() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg className="absolute inset-0 size-full">
        {ANNEAUX.map((anneau) => (
          <circle
            key={anneau.rayon}
            cx="50%"
            cy="50%"
            r={anneau.rayon}
            fill="none"
            className="stroke-white/20"
            strokeDasharray="4 6"
          />
        ))}
      </svg>
      {ANNEAUX.map((anneau) =>
        anneau.icones.map((Icone, position) => (
          <IconeEnOrbite
            key={`${anneau.rayon}-${position}`}
            Icone={Icone}
            anneau={anneau}
            position={position}
          />
        )),
      )}
    </div>
  );
}
