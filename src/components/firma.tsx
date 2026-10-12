"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

// Recuadro para firmar con el dedo o el mouse. Guarda la firma como imagen PNG en un campo oculto.
export function Firma({ nombre = "firma" }: { nombre?: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const [imagen, setImagen] = useState("");

  // Ajusta la resolución del lienzo a la pantalla para que el trazo se vea nítido.
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const preparar = () => {
      const escala = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = c.getBoundingClientRect();
      c.width = Math.round(width * escala);
      c.height = Math.round(height * escala);
      const ctx = c.getContext("2d")!;
      ctx.scale(escala, escala);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1f1a24";
    };
    preparar();
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    ultimo.current = punto(e);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current || !ultimo.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = punto(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo.current = p;
  }

  function terminar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    dibujando.current = false;
    setImagen(e.currentTarget.toDataURL("image/png"));
  }

  function borrar() {
    const c = lienzo.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setImagen("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <PenLine className="size-4 text-lila" aria-hidden />
          Firma
        </span>
        {imagen && (
          <button type="button" onClick={borrar} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-suave hover:bg-fondo hover:text-alerta">
            <Eraser className="size-3.5" aria-hidden />
            Borrar y firmar de nuevo
          </button>
        )}
      </div>
      <div className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-white transition-colors ${imagen ? "border-lila" : "border-borde"}`}>
        <canvas
          ref={lienzo}
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerLeave={terminar}
          className="block h-44 w-full cursor-crosshair touch-none"
          aria-label="Recuadro para firmar"
        />
        {!imagen && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-suave/70">Firmá acá con el dedo</span>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-borde" />
      </div>
      <input type="hidden" name={nombre} value={imagen} />
    </div>
  );
}
