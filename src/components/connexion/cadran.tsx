/** Graduations d'un cadran : 60 traits, plus longs toutes les 5 minutes. */
const TRAITS = Array.from({ length: 60 }, (_, rang) => rang);
const RAYON_EXTERIEUR = 100;
const PAS_HEURE = 5;

/** Cadran d'horloge gradué, derrière l'horloge à palettes du panneau de connexion (décor). */
export function Cadran({ className }: { className?: string }) {
  return (
    <svg viewBox="-104 -104 208 208" className={className} aria-hidden="true">
      <circle r={RAYON_EXTERIEUR} fill="none" className="stroke-white/10" strokeWidth="0.75" />
      {TRAITS.map((rang) => {
        const estHeure = rang % PAS_HEURE === 0;
        return (
          <line
            key={rang}
            y1={-RAYON_EXTERIEUR + 4}
            y2={-RAYON_EXTERIEUR + (estHeure ? 14 : 8)}
            transform={`rotate(${rang * 6})`}
            strokeLinecap="round"
            strokeWidth={estHeure ? 2 : 1}
            className={estHeure ? "stroke-accent/70" : "stroke-white/25"}
          />
        );
      })}
    </svg>
  );
}
