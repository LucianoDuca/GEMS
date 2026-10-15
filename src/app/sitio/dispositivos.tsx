"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Marcos de dispositivos para mostrar la app como se ve de verdad. Cada pantalla se dibuja
// a su resolución real (en puntos) y se achica en proporción al lugar disponible, como una captura.

function Escalar({ ancho, alto, children }: { ancho: number; alto: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => setEscala(e.contentRect.width / ancho));
    observador.observe(el);
    return () => observador.disconnect();
  }, [ancho]);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ aspectRatio: `${ancho} / ${alto}` }}>
      <div
        className="absolute left-0 top-0 origin-top-left transition-opacity duration-300"
        style={{ width: ancho, height: alto, transform: `scale(${escala})`, opacity: escala ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

// Barra de estado de iOS (hora, señal, wifi, batería).
export function BarraEstado({ clara = false }: { clara?: boolean }) {
  const color = clara ? "#fff" : "#000";
  return (
    <div className="flex h-[54px] items-center justify-between px-[34px] pt-[6px] text-[17px] font-semibold" style={{ color }}>
      <span className="w-[54px] text-center tracking-tight">9:41</span>
      <span className="flex items-center gap-[7px]">
        <svg width="19" height="12" viewBox="0 0 19 12" fill={color} aria-hidden><rect x="0" y="8" width="3.2" height="4" rx="1" /><rect x="5" y="5.5" width="3.2" height="6.5" rx="1" /><rect x="10" y="3" width="3.2" height="9" rx="1" /><rect x="15" y="0" width="3.2" height="12" rx="1" /></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill={color} aria-hidden><path d="M8.5 2.6c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.9 10.2 10.2 0 0 0 1.3 3.8l1.2 1.2a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2a6.8 6.8 0 0 0-9.6 0l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c-.5 0-1 .2-1.3.6l1.3 1.3 1.3-1.3c-.3-.4-.8-.6-1.3-.6Z" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke={color} strokeOpacity="0.4" /><rect x="2" y="2" width="20" height="9" rx="2.5" fill={color} /><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill={color} fillOpacity="0.45" /></svg>
      </span>
    </div>
  );
}

// iPhone 15 Pro: pantalla de 393 × 852 puntos, marco de titanio, Dynamic Island y botones laterales.
export function IPhone({ children, className = "", style, fondo = "#fff" }: { children: ReactNode; className?: string; style?: CSSProperties; fondo?: string }) {
  return (
    <div className={className} style={style}>
      <div className="@container relative">
        {/* Botones */}
        <span aria-hidden className="absolute -left-[0.6cqw] top-[17%] h-[5%] w-[1.1cqw] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute -left-[0.6cqw] top-[25%] h-[9%] w-[1.1cqw] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute -left-[0.6cqw] top-[36%] h-[9%] w-[1.1cqw] rounded-l-sm bg-[#3a3a3d]" />
        <span aria-hidden className="absolute -right-[0.6cqw] top-[29%] h-[13%] w-[1.1cqw] rounded-r-sm bg-[#3a3a3d]" />
        <div
          className="relative bg-gradient-to-br from-[#4a4a4e] via-[#1d1d1f] to-[#3a3a3d] p-[1.1cqw] shadow-[0_50px_100px_-30px_rgba(31,26,36,0.55),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          style={{ borderRadius: "16.5cqw" }}
        >
          <div className="bg-black p-[1.9cqw]" style={{ borderRadius: "15.4cqw" }}>
            <div className="relative overflow-hidden" style={{ borderRadius: "13.4cqw", background: fondo }}>
              <Escalar ancho={393} alto={852}>{children}</Escalar>
              {/* Dynamic Island */}
              <span aria-hidden className="absolute left-1/2 top-[3.1cqw] h-[9.4cqw] w-[32cqw] -translate-x-1/2 rounded-full bg-black" />
              {/* Barra de inicio */}
              <span aria-hidden className="absolute bottom-[2.2cqw] left-1/2 h-[1.3cqw] w-[36cqw] -translate-x-1/2 rounded-full bg-black/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// MacBook Pro 14": pantalla 1280 × 832 con notch, bisel negro y base de aluminio.
export function MacBook({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="@container relative">
        <div className="relative mx-[5.5cqw] bg-[#0b0b0d] p-[1.3cqw] pb-[1.6cqw] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" style={{ borderRadius: "2.6cqw 2.6cqw 0.8cqw 0.8cqw" }}>
          <div className="relative overflow-hidden bg-white" style={{ borderRadius: "1.2cqw 1.2cqw 0.2cqw 0.2cqw" }}>
            <Escalar ancho={1280} alto={832}>{children}</Escalar>
            {/* Notch con cámara */}
            <span aria-hidden className="absolute left-1/2 top-0 grid h-[2.6cqw] w-[13cqw] -translate-x-1/2 place-items-center rounded-b-[1cqw] bg-[#0b0b0d]">
              <span className="size-[0.8cqw] rounded-full bg-[#1d2a3a] shadow-[inset_0_0_0_0.15cqw_#0f1620]" />
            </span>
          </div>
        </div>
        {/* Base */}
        <div className="relative h-[2.3cqw] rounded-b-[2.2cqw] bg-gradient-to-b from-[#e4e4e7] via-[#c9c9ce] to-[#8e8e93] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
          <span aria-hidden className="absolute left-1/2 top-0 h-[0.9cqw] w-[16cqw] -translate-x-1/2 rounded-b-[0.9cqw] bg-gradient-to-b from-[#a1a1a6] to-[#d1d1d6]" />
        </div>
      </div>
    </div>
  );
}

// iPad Pro 11" en horizontal: pantalla 1194 × 834 con bisel parejo.
export function IPad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="@container relative">
        <div className="relative bg-gradient-to-br from-[#3c3c40] via-[#1d1d1f] to-[#3c3c40] p-[0.5cqw] shadow-[0_50px_100px_-35px_rgba(31,26,36,0.55)]" style={{ borderRadius: "4.4cqw" }}>
          <div className="relative bg-black p-[2.2cqw]" style={{ borderRadius: "4cqw" }}>
            <span aria-hidden className="absolute left-1/2 top-[0.85cqw] size-[0.6cqw] -translate-x-1/2 rounded-full bg-[#1d2a3a]" />
            <div className="relative overflow-hidden bg-white" style={{ borderRadius: "1.9cqw" }}>
              <Escalar ancho={1194} alto={834}>{children}</Escalar>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
