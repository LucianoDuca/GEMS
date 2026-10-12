// Sexo del cliente: adapta la silueta del mapa del cuerpo. Es opcional.
export function CampoSexo({ valor }: { valor?: "F" | "M" | null }) {
  const opciones = [
    { v: "F", t: "Mujer" },
    { v: "M", t: "Hombre" },
    { v: "", t: "Prefiere no decir" },
  ];
  return (
    <fieldset className="flex flex-col gap-1.5 text-sm">
      <legend className="mb-1.5 font-semibold">Sexo</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <label key={o.t} className="cursor-pointer">
            <input type="radio" name="sexo" value={o.v} defaultChecked={(valor ?? "") === o.v} className="peer sr-only" />
            <span className="inline-block rounded-xl border-2 border-borde bg-white px-4 py-2 font-semibold transition peer-checked:border-lila peer-checked:bg-lila peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-lila/20 hover:border-lila">
              {o.t}
            </span>
          </label>
        ))}
      </div>
      <span className="text-xs text-suave">Se usa para mostrar la silueta correcta al elegir zonas.</span>
    </fieldset>
  );
}
