"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Pantalla de bienvenida al iniciar sesión: el diamante de GEMS entra con un
// destello, y en un par de segundos se desvanece y deja ver el Inicio.
// Se puede saltar tocando en cualquier lado.
export function Bienvenida({ nombre, centro }: { nombre: string; centro: string }) {
  const router = useRouter();
  const [saltar, setSaltar] = useState(false);

  return (
    <div
      aria-hidden
      onClick={() => setSaltar(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) router.replace("/", { scroll: false });
      }}
      className={`bienvenida fixed inset-0 z-[60] grid cursor-pointer place-items-center overflow-hidden bg-gradient-to-br from-lila via-lila to-lila-oscuro text-white ${saltar ? "bienvenida-saltar" : ""}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-celeste/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative grid size-32 place-items-center">
          {/* Ondas que salen del diamante */}
          <span className="bienvenida-onda absolute inset-0 rounded-[2.25rem] border-2 border-white/40" />
          <span className="bienvenida-onda absolute inset-0 rounded-[2.25rem] border-2 border-white/30" style={{ animationDelay: "0.95s" }} />
          <div className="bienvenida-diamante relative grid size-32 place-items-center overflow-hidden rounded-[2.25rem] bg-white shadow-2xl shadow-lila-oscuro/40">
            <Image src="/gems-diamante.png" alt="" width={512} height={512} priority className="size-20" />
            <span className="bienvenida-brillo absolute inset-0" />
          </div>
        </div>
        <Image src="/gems-logo-blanco.png" alt="" width={1200} height={276} priority className="bienvenida-texto mt-8 h-auto w-44" style={{ animationDelay: "0.55s" }} />
        <p className="bienvenida-texto mt-6 text-2xl font-bold tracking-tight" style={{ animationDelay: "0.8s" }}>¡Hola, {nombre}!</p>
        <p className="bienvenida-texto mt-1 text-white/80" style={{ animationDelay: "0.95s" }}>{centro}</p>
      </div>
    </div>
  );
}
