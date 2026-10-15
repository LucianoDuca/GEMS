"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck } from "lucide-react";

// Conversación de WhatsApp que se escribe sola cuando aparece en pantalla.
const MENSAJES = [
  { de: "centro", texto: "¡Hola Lu! Te recordamos tu turno de depilación mañana a las 15:00. ¿Nos confirmás? 😊", hora: "10:02" },
  { de: "clienta", texto: "Hola!! Sí, ahí estoy 🙌", hora: "10:05" },
  { de: "centro", texto: "¡Genial! Te esperamos. Recordá venir sin cremas en la zona.", hora: "10:05" },
  { de: "clienta", texto: "Perfecto, gracias ❤️", hora: "10:06" },
];

export function ChatWhatsApp() {
  const ref = useRef<HTMLDivElement>(null);
  const [mostrados, setMostrados] = useState(0);
  const [escribiendo, setEscribiendo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tiempos: number[] = [];
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observador.disconnect();
        let t = 300;
        MENSAJES.forEach((_, i) => {
          tiempos.push(window.setTimeout(() => setEscribiendo(true), t));
          t += 1100;
          tiempos.push(window.setTimeout(() => { setEscribiendo(false); setMostrados(i + 1); }, t));
          t += 500;
        });
      },
      { threshold: 0.4 },
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      tiempos.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="mx-auto w-full max-w-[22rem] overflow-hidden rounded-[2.75rem] bg-tinta p-2.5 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.6)]">
      <div className="overflow-hidden rounded-[2.25rem] bg-[#efe7de] text-[#111b21]">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 pb-3 pt-6 text-white">
          <span className="grid size-9 place-items-center rounded-full bg-white/20 text-sm font-bold">LG</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Lucía García</div>
            <div className="text-[11px] text-white/70">{escribiendo && mostrados % 2 === 1 ? "escribiendo…" : "en línea"}</div>
          </div>
        </div>
        <div className="flex min-h-[23rem] flex-col justify-end gap-2 p-3">
          {MENSAJES.slice(0, mostrados).map((m, i) => (
            <div key={i} className={`burbuja max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm ${m.de === "centro" ? "self-end rounded-tr-sm bg-[#d9fdd3]" : "self-start rounded-tl-sm bg-white"}`}>
              {m.texto}
              <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-[#667781]">
                {m.hora}
                {m.de === "centro" && <CheckCheck className="size-3.5 text-[#53bdeb]" aria-hidden />}
              </span>
            </div>
          ))}
          {escribiendo && (
            <div className={`flex gap-1 rounded-2xl px-3 py-3 shadow-sm ${mostrados % 2 === 0 ? "self-end bg-[#d9fdd3]" : "self-start bg-white"}`}>
              {[0, 1, 2].map((p) => <span key={p} className="punto-escribiendo size-1.5 rounded-full bg-[#667781]" style={{ animationDelay: `${p * 150}ms` }} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
