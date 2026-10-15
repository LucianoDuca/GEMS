"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

// Aparece cuando entra en pantalla (una sola vez).
export function Revelar({
  children,
  efecto = "subir",
  retraso = 0,
  className = "",
}: {
  children: ReactNode;
  efecto?: "subir" | "aparecer" | "escala" | "izquierda" | "derecha";
  retraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref);
  return (
    <div ref={ref} className={`revelar revelar-${efecto} ${visible ? "revelado" : ""} ${className}`} style={{ transitionDelay: `${retraso}ms` }}>
      {children}
    </div>
  );
}

function useVisible(ref: React.RefObject<HTMLElement | null>, umbral = 0.18) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: umbral, rootMargin: "0px 0px -6% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref, umbral]);
  return visible;
}

// Número que cuenta desde cero cuando se ve.
export function Contador({ hasta, prefijo = "", sufijo = "", duracion = 1400 }: { hasta: number; prefijo?: string; sufijo?: string; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useVisible(ref, 0.5);
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => setValor(hasta));
      return;
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const avance = Math.min(1, (t - inicio) / duracion);
      setValor(Math.round(hasta * (1 - Math.pow(1 - avance, 3))));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [visible, hasta, duracion]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {valor.toLocaleString("es-AR")}
      {sufijo}
    </span>
  );
}

// Se inclina en 3D siguiendo el mouse (solo en computadora).
export function Inclinar({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [estilo, setEstilo] = useState<CSSProperties>({});
  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: "1400px" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        setEstilo({ transform: `rotateY(${x * 9}deg) rotateX(${-y * 7}deg)` });
      }}
      onPointerLeave={() => setEstilo({})}
    >
      <div className="inclinar-capa" style={estilo}>{children}</div>
    </div>
  );
}

// Barra de arriba: transparente sobre la portada oscura, blanca al bajar. En el celular, menú desplegable.
export function Encabezado({ demo }: { demo: string }) {
  const [abajo, setAbajo] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const revisar = () => setAbajo(window.scrollY > 40);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);
  const claro = abajo || menu;
  const enlaces = [
    { href: "#producto", texto: "Producto" },
    { href: "#whatsapp", texto: "Fidelización" },
    { href: "#seguridad", texto: "Seguridad" },
    { href: "#empezar", texto: "Cómo empezar" },
    { href: "#preguntas", texto: "Preguntas" },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${claro ? "bg-white/90 shadow-[0_1px_0_rgba(31,26,36,0.06)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Link href="/sitio" aria-label="GEMS Gestión" className="relative h-7 w-32 shrink-0">
          <Image src="/gems-logo-blanco.png" alt="GEMS" width={1200} height={276} priority className={`absolute inset-0 h-auto w-32 transition-opacity duration-500 ${claro ? "opacity-0" : "opacity-100"}`} />
          <Image src="/gems-logo.png" alt="" width={1200} height={276} priority className={`absolute inset-0 h-auto w-32 transition-opacity duration-500 ${claro ? "opacity-100" : "opacity-0"}`} />
        </Link>
        <nav className={`hidden items-center gap-7 text-[0.9rem] font-medium lg:flex ${claro ? "text-tinta/70" : "text-white/75"}`}>
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className={`subrayado transition-colors ${claro ? "hover:text-lila" : "hover:text-white"}`}>{e.texto}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:block ${claro ? "text-tinta/70 hover:text-lila" : "text-white/80 hover:text-white"}`}>
            Ingresar
          </Link>
          <a href={demo} target="_blank" rel="noopener noreferrer" className={`boton-brillo hidden whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition sm:inline-flex ${claro ? "bg-tinta text-white hover:bg-lila" : "bg-white text-tinta hover:bg-lila-claro"}`}>
            Pedí una demo
          </a>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menú" className={`grid size-10 place-items-center rounded-full lg:hidden ${claro ? "text-tinta" : "text-white"}`}>
            {menu ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>
      {menu && (
        <nav className="animar-entrada flex flex-col gap-1 bg-white px-5 pb-6 pt-2 shadow-xl lg:hidden">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setMenu(false)} className="rounded-2xl px-4 py-3.5 text-lg font-medium text-tinta hover:bg-fondo">{e.texto}</a>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/login" className="rounded-full bg-fondo px-4 py-3.5 text-center font-semibold">Ingresar</Link>
            <a href={demo} target="_blank" rel="noopener noreferrer" className="rounded-full bg-lila px-4 py-3.5 text-center font-semibold text-white">Pedí una demo</a>
          </div>
        </nav>
      )}
    </header>
  );
}
