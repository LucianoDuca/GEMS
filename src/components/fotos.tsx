"use client";

/* eslint-disable @next/next/no-img-element -- fotos privadas servidas con enlaces firmados de Supabase */
import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, Loader2, MoveHorizontal } from "lucide-react";
import { MensajeError, MensajeOk } from "@/components/ui";
import type { EstadoFormulario } from "@/lib/tipos";

// Achica la foto en el navegador (máx. 1600 px, JPG) para que suba rápido incluso con datos móviles.
async function achicar(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  return new Promise((ok) => lienzo.toBlob((b) => ok(b!), "image/jpeg", 0.82));
}

const TIPOS = [
  { valor: "antes", texto: "Antes" },
  { valor: "despues", texto: "Después" },
  { valor: "progreso", texto: "Progreso" },
];

export function SubirFoto({ accion }: { accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario> }) {
  const [estado, despachar] = useActionState(accion, undefined);
  const [subiendo, startTransition] = useTransition();
  const [vista, setVista] = useState<string | null>(null);
  const [tipo, setTipo] = useState("antes");
  const form = useRef<HTMLFormElement>(null);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const archivo = datos.get("foto");
    startTransition(async () => {
      if (archivo instanceof File && archivo.size > 0) datos.set("foto", new File([await achicar(archivo)], "foto.jpg", { type: "image/jpeg" }));
      startTransition(() => despachar(datos));
      form.current?.reset();
      setVista(null);
    });
  }

  return (
    <form ref={form} onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl bg-fondo p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="relative grid aspect-square w-full shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-lila/40 bg-white text-lila hover:bg-lila-claro sm:w-36">
          {vista ? (
            <img src={vista} alt="Vista previa" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm font-semibold">
              <Camera className="size-7" aria-hidden />
              Sacar o elegir
            </span>
          )}
          <input
            type="file"
            name="foto"
            accept="image/*"
            capture="environment"
            required
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setVista(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex gap-2" role="radiogroup" aria-label="Tipo de foto">
            {TIPOS.map((t) => (
              <label key={t.valor} className={`flex-1 cursor-pointer rounded-xl border-2 py-2 text-center text-sm font-semibold transition ${tipo === t.valor ? "border-lila bg-lila text-white" : "border-borde bg-white hover:border-lila"}`}>
                <input type="radio" name="tipo" value={t.valor} checked={tipo === t.valor} onChange={() => setTipo(t.valor)} className="sr-only" />
                {t.texto}
              </label>
            ))}
          </div>
          <input name="zona" placeholder="Zona (opcional): abdomen, piernas…" maxLength={60} className="rounded-xl border border-borde bg-white px-4 py-2.5 text-base outline-none focus:border-lila focus:ring-4 focus:ring-lila/15" />
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" name="consentimiento" required className="mt-0.5 size-5 shrink-0 accent-lila" />
            La persona autorizó que se le saque y guarde esta foto.
          </label>
        </div>
      </div>
      <MensajeError>{estado?.error}</MensajeError>
      <MensajeOk>{estado?.ok}</MensajeOk>
      <button type="submit" disabled={subiendo} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-lila px-5 py-2.5 text-sm font-semibold text-white hover:bg-lila-oscuro disabled:opacity-50">
        {subiendo ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
        {subiendo ? "Subiendo…" : "Guardar foto"}
      </button>
    </form>
  );
}

// Compara antes y después deslizando una línea sobre las dos fotos.
export function Comparador({ antes, despues }: { antes: string; despues: string }) {
  const [corte, setCorte] = useState(50);
  return (
    <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl bg-tinta">
      <img src={despues} alt="Después" className="absolute inset-0 size-full object-cover" draggable={false} />
      <img src={antes} alt="Antes" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - corte}% 0 0)` }} draggable={false} />
      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">Antes</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">Después</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${corte}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lila shadow-lg">
          <MoveHorizontal className="size-5" aria-hidden />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={corte}
        onChange={(e) => setCorte(Number(e.target.value))}
        aria-label="Deslizá para comparar antes y después"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
