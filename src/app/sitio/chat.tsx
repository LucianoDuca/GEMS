"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, ChevronLeft, Mic } from "lucide-react";
import { BarraEstado, IPhone } from "./dispositivos";

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
    <div ref={ref}>
      <IPhone className="mx-auto w-[min(20rem,82vw)]" fondo="#efe7de">
        <div className="flex h-full flex-col bg-[#efe7de] text-[#111b21]">
          <div className="bg-[#075e54] pb-3 text-white">
            <BarraEstado clara />
            <div className="flex items-center gap-3 px-4 pt-1">
              <ChevronLeft className="size-7" aria-hidden />
              <span className="grid size-10 place-items-center rounded-full bg-white/20 text-sm font-bold">LG</span>
              <div className="leading-tight">
                <div className="text-[17px] font-semibold">Lucía García</div>
                <div className="text-[13px] text-white/70">{escribiendo && mostrados % 2 === 1 ? "escribiendo…" : "en línea"}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-2 p-3">
            <span className="mb-2 self-center rounded-lg bg-white/80 px-3 py-1 text-[12px] text-[#54656f] shadow-sm">HOY</span>
            {MENSAJES.slice(0, mostrados).map((m, i) => (
              <div key={i} className={`burbuja max-w-[80%] rounded-2xl px-3 py-2 text-[15px] leading-snug shadow-sm ${m.de === "centro" ? "self-end rounded-tr-sm bg-[#d9fdd3]" : "self-start rounded-tl-sm bg-white"}`}>
                {m.texto}
                <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[11px] text-[#667781]">
                  {m.hora}
                  {m.de === "centro" && <CheckCheck className="size-4 text-[#53bdeb]" aria-hidden />}
                </span>
              </div>
            ))}
            {escribiendo && (
              <div className={`flex gap-1 rounded-2xl px-3.5 py-3.5 shadow-sm ${mostrados % 2 === 0 ? "self-end bg-[#d9fdd3]" : "self-start bg-white"}`}>
                {[0, 1, 2].map((p) => <span key={p} className="punto-escribiendo size-2 rounded-full bg-[#667781]" style={{ animationDelay: `${p * 150}ms` }} />)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-[#f6f6f6] px-3 pb-9 pt-2">
            <span className="flex-1 rounded-full bg-white px-4 py-2.5 text-[15px] text-[#8696a0]">Mensaje</span>
            <span className="grid size-10 place-items-center rounded-full bg-[#00a884] text-white"><Mic className="size-5" aria-hidden /></span>
          </div>
        </div>
      </IPhone>
    </div>
  );
}
