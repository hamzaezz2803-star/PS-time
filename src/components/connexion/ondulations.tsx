const NOMBRE_CERCLES = 7;
const TAILLE_PREMIER_CERCLE_PX = 200;
const ECART_CERCLES_PX = 90;

/** Cercles concentriques décoratifs derrière le logo. */
export function Ondulations() {
  return (
    <div
      className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle,black_35%,transparent_75%)]"
      aria-hidden="true"
    >
      {Array.from({ length: NOMBRE_CERCLES }, (_, index) => {
        const taille = TAILLE_PREMIER_CERCLE_PX + index * ECART_CERCLES_PX;
        return (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ondulation rounded-full border border-white/15 bg-white/[0.03] motion-reduce:animate-none"
            style={{
              width: taille,
              height: taille,
              animationDelay: `${index * 0.15}s`,
            }}
          />
        );
      })}
    </div>
  );
}
