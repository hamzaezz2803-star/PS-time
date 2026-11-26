import { cn } from "@/lib/utils";

type Bulle = {
  /** Position le long du bord, en pourcentage. */
  position: number;
  taillePx: number;
  /** Décalage vers l'intérieur du panneau, en pixels (négatif = vers l'extérieur). */
  decalagePx: number;
};

/** Bord principal : bulles serrées qui forment le nuage. */
const BULLES_NUAGE: Bulle[] = [
  { position: -4, taillePx: 120, decalagePx: 30 },
  { position: 10, taillePx: 90, decalagePx: 10 },
  { position: 22, taillePx: 130, decalagePx: 40 },
  { position: 36, taillePx: 80, decalagePx: 5 },
  { position: 48, taillePx: 140, decalagePx: 45 },
  { position: 62, taillePx: 95, decalagePx: 15 },
  { position: 74, taillePx: 125, decalagePx: 35 },
  { position: 88, taillePx: 85, decalagePx: 10 },
  { position: 100, taillePx: 130, decalagePx: 40 },
];

/** Bulles détachées, plus petites, qui « s'échappent » du nuage. */
const BULLES_LIBRES: Bulle[] = [
  { position: 16, taillePx: 22, decalagePx: 95 },
  { position: 42, taillePx: 14, decalagePx: 80 },
  { position: 56, taillePx: 30, decalagePx: 115 },
  { position: 82, taillePx: 18, decalagePx: 90 },
];

function styleBulle(bulle: Bulle, sens: "vertical" | "horizontal") {
  const centre = `calc(${bulle.position}% - ${bulle.taillePx / 2}px)`;
  const bord = `${bulle.decalagePx - bulle.taillePx}px`;
  return sens === "vertical"
    ? { top: centre, right: bord, width: bulle.taillePx, height: bulle.taillePx }
    : { left: centre, bottom: bord, width: bulle.taillePx, height: bulle.taillePx };
}

/**
 * Bord en forme de nuage entre le panneau de marque et le formulaire :
 * à droite du panneau sur ordinateur, en bas sur téléphone. Purement décoratif.
 */
export function BordNuage({ sens }: { sens: "vertical" | "horizontal" }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute",
        sens === "vertical" ? "inset-y-0 end-0 w-0" : "inset-x-0 bottom-0 h-0",
      )}
      aria-hidden="true"
    >
      {/* Couche translucide derrière, pour donner du relief au nuage. */}
      {BULLES_NUAGE.map((bulle) => (
        <span
          key={`voile-${bulle.position}`}
          className="absolute rounded-full bg-surface/25"
          style={styleBulle({ ...bulle, decalagePx: bulle.decalagePx + 28 }, sens)}
        />
      ))}
      {BULLES_NUAGE.map((bulle) => (
        <span
          key={`nuage-${bulle.position}`}
          className="absolute rounded-full bg-surface"
          style={styleBulle(bulle, sens)}
        />
      ))}
      {/* Sur le bandeau du téléphone, trop bas, elles passeraient sur le texte. */}
      {sens === "vertical" && BULLES_LIBRES.map((bulle) => (
        <span
          key={`libre-${bulle.position}`}
          className="absolute rounded-full bg-surface/70"
          style={styleBulle(bulle, sens)}
        />
      ))}
    </div>
  );
}
