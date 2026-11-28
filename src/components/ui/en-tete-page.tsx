/** Titre unique de la page, identique sur tous les écrans connectés. */
export function EnTetePage({ titre }: { titre: string }) {
  return <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem] sm:leading-tight">{titre}</h1>;
}
