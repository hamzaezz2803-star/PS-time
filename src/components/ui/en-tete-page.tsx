/** Titre unique de la page et phrase d'appui, identiques sur tous les écrans connectés. */
export function EnTetePage({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-bold tracking-tight text-marine sm:text-[1.75rem] sm:leading-tight">{titre}</h1>
      <p className="max-w-2xl text-base text-texte-secondaire">{sousTitre}</p>
    </div>
  );
}
