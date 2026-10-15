import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BellRing, Building2, CalendarDays, Camera, Check, ChevronDown, FileSpreadsheet, HeartPulse, LockKeyhole,
  MessageCircle, MousePointerClick, PenLine, PersonStanding, ShieldCheck, Smartphone, Sparkles, Upload, UsersRound, Wallet,
} from "lucide-react";
import { enlaceDemo } from "./contacto";

export const metadata: Metadata = {
  title: "GEMS Gestión · El sistema para centros de estética",
  description:
    "Fichas de salud firmadas, historial de sesiones, agenda por operadora, caja con reportes y recordatorios por WhatsApp. El sistema de gestión para centros de estética de Argentina.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "GEMS Gestión",
    description: "Tu centro de estética, ordenado y en un solo lugar.",
    images: ["/gems-logo.png"],
    locale: "es_AR",
    type: "website",
  },
};

const FUNCIONES = [
  { icono: HeartPulse, titulo: "Ficha de salud con firma", texto: "La clienta completa la ficha con vos y firma con el dedo en la pantalla. Si hay algo para revisar (embarazo, marcapasos, medicación), el sistema avisa antes de cada sesión." },
  { icono: PersonStanding, titulo: "Zonas tocando el cuerpo", texto: "Para registrar una sesión, la operadora toca las zonas sobre una silueta de mujer u hombre. Potencia, tratamiento y observaciones quedan en el historial." },
  { icono: Sparkles, titulo: "Historial al instante", texto: "Buscás por DNI o nombre y ves todo: cuántas sesiones lleva de cada tratamiento, cuándo vino por última vez y qué se le hizo." },
  { icono: CalendarDays, titulo: "Agenda por operadora", texto: "Turnos del día o de la semana, una columna por operadora y sin superposiciones. Cuando llega la clienta, un toque y se abre la sesión." },
  { icono: MessageCircle, titulo: "WhatsApp que trae clientas", texto: "Te avisa a quién le toca volver, quién cumple años y qué turnos de mañana conviene recordar. El mensaje ya está escrito: solo apretás enviar." },
  { icono: Wallet, titulo: "Caja con reportes", texto: "Cobros y gastos por concepto (sueldos, impuestos, insumos). Resumen del día, la semana, el mes o el año, y el extracto en Excel para el contador." },
  { icono: Camera, titulo: "Fotos antes y después", texto: "Guardadas en la ficha de cada clienta, con su consentimiento, y un comparador para mostrarle el avance." },
  { icono: Building2, titulo: "Equipo y sucursales", texto: "Cada persona entra con su usuario. La dueña ve todo; las operadoras, lo que necesitan. Si tenés más de un local, cambiás entre sucursales y ves el total." },
];

const PREGUNTAS = [
  { p: "¿Tengo que instalar algo?", r: "No. Funciona en el navegador de la computadora, la tablet o el celular. En el celular se puede agregar a la pantalla de inicio y se usa como una app." },
  { p: "Hoy uso Google Forms y planillas. ¿Pierdo lo que tengo?", r: "No. Importamos tus planillas de fichas de salud y de seguimiento de sesiones, así arrancás con todo el historial de tus clientas." },
  { p: "¿Es difícil de usar para mi equipo?", r: "Está pensado para que cualquiera lo use sin capacitación larga: botones grandes, pasos guiados y un tutorial dentro de la app. Igual te acompañamos en el arranque." },
  { p: "¿Quién ve los datos de mis clientas?", r: "Solo tu centro. Cada estética tiene su espacio separado, las fichas de salud no las ve nadie más (tampoco GEMS) y cada movimiento queda registrado." },
  { p: "¿Puedo tener varias sucursales?", r: "Sí. Cada local tiene su agenda y su caja, y la dueña ve el resumen de todas." },
  { p: "¿Qué pasa si un mes no pago?", r: "Te avisamos antes del vencimiento. Si el servicio se suspende, tus datos quedan guardados y vuelve a funcionar apenas se registra el pago." },
];

export default function Sitio() {
  const demo = enlaceDemo("¡Hola! Quiero conocer GEMS Gestión para mi centro de estética.");

  return (
    <div className="sitio bg-white text-tinta">
      {/* ───────── Encabezado ───────── */}
      <header className="sticky top-0 z-30 border-b border-borde/60 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/sitio" className="shrink-0" aria-label="GEMS Gestión">
            <Image src="/gems-logo.png" alt="GEMS" width={1200} height={276} priority className="h-auto w-28" />
          </Link>
          <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-semibold text-suave lg:flex">
            <a href="#funciones" className="hover:text-lila">Funciones</a>
            <a href="#como" className="hover:text-lila">Cómo empezar</a>
            <a href="#seguridad" className="hover:text-lila">Seguridad</a>
            <a href="#preguntas" className="hover:text-lila">Preguntas</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-suave hover:text-lila">Ingresar</Link>
            <a href={demo} target="_blank" rel="noopener noreferrer" className="hidden whitespace-nowrap rounded-xl bg-lila px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-lila/30 hover:bg-lila-oscuro sm:inline-flex">
              Pedí una demo
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ───────── Portada ───────── */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-40 -top-40 size-[36rem] rounded-full bg-celeste/15 blur-3xl" />
            <div className="absolute -left-40 top-40 size-[30rem] rounded-full bg-lila/15 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-lila-claro px-3 py-1.5 text-xs font-bold text-lila">
                <Sparkles className="size-3.5" aria-hidden />
                Hecho para centros de estética de Argentina
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Tu centro de estética, <span className="bg-gradient-to-r from-lila to-celeste bg-clip-text text-transparent">ordenado y en un solo lugar</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-suave">
                Fichas de salud firmadas, historial de cada clienta, agenda, caja y recordatorios por WhatsApp. Dejá las planillas y los formularios sueltos: atendé más rápido y que ninguna clienta se te escape.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lila px-6 py-4 font-semibold text-white shadow-lg shadow-lila/30 transition hover:-translate-y-0.5 hover:bg-lila-oscuro">
                  <MessageCircle className="size-5" aria-hidden />
                  Pedí una demo por WhatsApp
                </a>
                <a href="#funciones" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-borde px-6 py-4 font-semibold hover:border-lila hover:text-lila">
                  Ver qué incluye
                  <ChevronDown className="size-5" aria-hidden />
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-suave">
                {["Sin instalar nada", "Importamos tus planillas", "Funciona en el celular"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="size-4 text-emerald-600" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
            <Maqueta />
          </div>
        </section>

        {/* ───────── El problema ───────── */}
        <section className="bg-fondo py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Titulo antetitulo="¿Te suena?" titulo="Planillas, formularios y el cuaderno de turnos" />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { antes: "La ficha de salud está en un formulario y el seguimiento en otra planilla.", despues: "Todo en la ficha de la clienta: salud, sesiones, fotos y pagos." },
                { antes: "Para saber cuántas sesiones lleva, hay que buscar fila por fila.", despues: "Lo ves al instante, por tratamiento, con la fecha de la última." },
                { antes: "Las clientas que dejan de venir no las llama nadie.", despues: "Te avisa a quién le toca volver y le escribís por WhatsApp en un toque." },
              ].map((x) => (
                <div key={x.antes} className="aparecer rounded-3xl bg-white p-6 shadow-sm ring-1 ring-borde/70">
                  <p className="text-sm text-suave line-through decoration-alerta/50">{x.antes}</p>
                  <p className="mt-4 flex items-start gap-2 font-semibold">
                    <ArrowRight className="mt-0.5 size-5 shrink-0 text-lila" aria-hidden />
                    {x.despues}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Funciones ───────── */}
        <section id="funciones" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Titulo antetitulo="Todo lo que necesitás" titulo="Pensado para el día a día de una estética" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
                <div key={titulo} className="aparecer group rounded-3xl border border-borde/70 p-6 transition hover:-translate-y-1 hover:border-lila/40 hover:shadow-lg hover:shadow-lila/10">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-lila-claro to-celeste-claro text-lila transition group-hover:from-lila group-hover:to-lila-oscuro group-hover:text-white">
                    <Icono className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-bold">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-suave">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── WhatsApp, destacado ───────── */}
        <section className="py-4">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="aparecer grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-lila via-lila to-lila-oscuro p-8 text-white shadow-xl shadow-lila/20 sm:p-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">Más clientas que vuelven</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Cada mañana, a quién escribirle.</h2>
                <p className="mt-4 text-white/85">
                  GEMS calcula cuándo le toca volver a cada clienta según su tratamiento, te recuerda los turnos del día siguiente y los cumpleaños. Tocás el botón y se abre WhatsApp con el mensaje listo.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { icono: BellRing, nombre: "Lucía G.", detalle: "Turno mañana 15:00 · recordar", boton: "Recordar" },
                  { icono: Sparkles, nombre: "Carla M.", detalle: "Le toca depilación hace 3 días", boton: "WhatsApp" },
                  { icono: HeartPulse, nombre: "Sofía R.", detalle: "Cumple 32 años hoy 🎂", boton: "Saludar" },
                ].map(({ icono: Icono, nombre, detalle, boton }) => (
                  <div key={nombre} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-tinta shadow-lg">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lila-claro text-lila"><Icono className="size-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{nombre}</span>
                      <span className="block truncate text-sm text-suave">{detalle}</span>
                    </span>
                    <span className="rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white">{boton}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Cómo empezar ───────── */}
        <section id="como" className="scroll-mt-16 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Titulo antetitulo="Cómo empezar" titulo="En pocos días estás atendiendo con GEMS" />
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icono: MousePointerClick, titulo: "Te damos de alta", texto: "Creamos el espacio de tu centro con tus tratamientos, zonas y equipo. Cada persona recibe su usuario." },
                { icono: Upload, titulo: "Traemos tus planillas", texto: "Importamos las fichas de salud y el historial de sesiones que tenías en Google Forms o Excel." },
                { icono: PenLine, titulo: "Empezás a atender", texto: "Buscás a la clienta, revisás sus alertas y registrás la sesión en menos de un minuto." },
              ].map(({ icono: Icono, titulo, texto }, i) => (
                <li key={titulo} className="aparecer relative rounded-3xl bg-fondo p-6">
                  <span className="absolute right-6 top-5 text-5xl font-extrabold text-lila/10">{i + 1}</span>
                  <Icono className="size-7 text-lila" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-suave">{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── Seguridad ───────── */}
        <section id="seguridad" className="scroll-mt-16 bg-tinta py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-celeste">Datos de salud, bien cuidados</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Las fichas de tus clientas son solo de tu centro.</h2>
              <p className="mt-4 text-white/70">Una ficha de salud es información sensible. GEMS está construido para protegerla desde el primer día.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icono: LockKeyhole, titulo: "Cada centro, su espacio", texto: "Ningún otro centro puede ver tus clientas. Ni siquiera GEMS accede a las fichas ni a las fotos." },
                { icono: UsersRound, titulo: "Permisos por persona", texto: "Cada integrante entra con su usuario y la dueña decide quién tiene acceso." },
                { icono: ShieldCheck, titulo: "Nada se borra a escondidas", texto: "Las sesiones y los cobros se anulan con un motivo, y cada cambio queda registrado." },
                { icono: Smartphone, titulo: "Conexión segura", texto: "Todo viaja cifrado y se guarda en servidores profesionales en la nube." },
              ].map(({ icono: Icono, titulo, texto }) => (
                <div key={titulo} className="aparecer rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                  <Icono className="size-6 text-celeste" aria-hidden />
                  <h3 className="mt-4 font-bold">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Respaldo GEMS ───────── */}
        <section className="py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
            <Image src="/gems-diamante.png" alt="" width={512} height={512} className="aparecer size-16" />
            <h2 className="aparecer mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">De GEMS, la marca de tu equipamiento médico-estético.</h2>
            <p className="aparecer mt-4 max-w-2xl text-lg text-suave">
              Conocemos cómo trabaja una estética porque te acompañamos desde el equipamiento. GEMS Gestión es el paso siguiente: que el resto del centro funcione igual de bien.
            </p>
          </div>
        </section>

        {/* ───────── Preguntas ───────── */}
        <section id="preguntas" className="scroll-mt-16 bg-fondo py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Titulo antetitulo="Preguntas frecuentes" titulo="Lo que nos suelen preguntar" />
            <div className="mt-10 flex flex-col gap-3">
              {PREGUNTAS.map(({ p, r }) => (
                <details key={p} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-borde/70 open:ring-lila/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {p}
                    <ChevronDown className="size-5 shrink-0 text-lila transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-suave">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Cierre ───────── */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-celeste to-[#0078b0] p-10 text-center text-white sm:p-16">
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-2xl" />
              <h2 className="relative text-3xl font-extrabold leading-tight sm:text-4xl">¿Lo vemos funcionando en tu centro?</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/85">Escribinos y te mostramos GEMS con un ejemplo real en 15 minutos. Sin compromiso.</p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-semibold text-celeste shadow-lg transition hover:-translate-y-0.5">
                  <MessageCircle className="size-5" aria-hidden />
                  Pedí tu demo
                </a>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 px-6 py-4 font-semibold hover:bg-white/10">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-borde/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-suave sm:flex-row sm:px-6">
          <Image src="/gems-logo.png" alt="GEMS" width={1200} height={276} className="h-auto w-24" />
          <p>© {new Date().getFullYear()} GEMS · Equipamiento médico-estético</p>
          <Link href="/login" className="font-semibold hover:text-lila">Ingresar al sistema</Link>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={demo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl shadow-black/20 transition hover:scale-105"
      >
        <MessageCircle className="size-7" aria-hidden />
      </a>
    </div>
  );
}

function Titulo({ antetitulo, titulo }: { antetitulo: string; titulo: string }) {
  return (
    <div className="aparecer mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-lila">{antetitulo}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{titulo}</h2>
    </div>
  );
}

// Maqueta de la app (dibujada, sin datos reales): computadora con el Inicio y celular con una ficha.
function Maqueta() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="maqueta-flotar rounded-[1.6rem] bg-tinta p-2 shadow-2xl shadow-lila/25">
        <div className="flex overflow-hidden rounded-[1.2rem] bg-fondo">
          <div className="hidden w-28 shrink-0 flex-col gap-2 bg-gradient-to-b from-lila to-lila-oscuro p-3 sm:flex">
            <Image src="/gems-logo-blanco.png" alt="" width={1200} height={276} className="mb-2 h-auto w-16" />
            {["Inicio", "Agenda", "Clientes", "Caja"].map((t, i) => (
              <span key={t} className={`rounded-lg px-2 py-1.5 text-[10px] font-semibold ${i === 0 ? "bg-white text-lila" : "text-white/85"}`}>{t}</span>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            <div className="rounded-2xl bg-gradient-to-br from-lila to-lila-oscuro p-4 text-white">
              <div className="text-[10px] text-white/75">Jueves, 15 de octubre</div>
              <div className="text-base font-bold">Buen día, Marina</div>
              <div className="mt-2 h-7 rounded-lg bg-white/95" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["Sesiones hoy", "12"], ["Caja hoy", "$ 186.500"], ["Nuevas", "9"]].map(([e, v]) => (
                <div key={e} className="rounded-xl bg-white p-2.5 ring-1 ring-borde/70">
                  <div className="text-[9px] text-suave">{e}</div>
                  <div className="text-sm font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-borde/70">
              <div className="mb-2 text-[10px] font-semibold">Turnos de hoy</div>
              {[["10:00", "Valentina P.", "Depilación"], ["11:00", "Julieta S.", "Reductor"], ["12:30", "Florencia D.", "Facial"]].map(([h, n, c], i) => (
                <div key={h} className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[10px] ${i === 0 ? "bg-lila-claro" : ""}`}>
                  <span className="w-8 font-bold">{h}</span>
                  <span className="size-5 rounded-full bg-gradient-to-br from-lila-claro to-celeste-claro" />
                  <span className="flex-1 font-semibold">{n}</span>
                  <span className="text-suave">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Celular */}
      <div className="maqueta-flotar-2 absolute -bottom-10 -left-2 w-40 rounded-[1.6rem] bg-tinta p-1.5 shadow-2xl shadow-black/20 sm:-left-8 sm:w-44">
        <div className="overflow-hidden rounded-[1.25rem] bg-white">
          <div className="bg-gradient-to-br from-lila to-lila-oscuro p-3 text-white">
            <div className="mx-auto mb-1.5 grid size-9 place-items-center rounded-full bg-white/20 text-[11px] font-bold">VP</div>
            <div className="text-center text-[11px] font-bold">Valentina P.</div>
            <div className="text-center text-[9px] text-white/75">8 sesiones · depilación</div>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5">
            <div className="rounded-lg bg-alerta-claro px-2 py-1.5 text-[9px] font-semibold text-alerta">⚠ Revisar: piel sensible</div>
            <div className="rounded-lg bg-[#25d366] px-2 py-1.5 text-center text-[9px] font-semibold text-white">WhatsApp</div>
            <div className="rounded-lg bg-lila px-2 py-1.5 text-center text-[9px] font-semibold text-white">Registrar sesión</div>
          </div>
        </div>
      </div>

      {/* Etiqueta flotante */}
      <div className="maqueta-flotar-2 absolute -right-2 -top-6 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-xl ring-1 ring-borde/70 sm:-right-6">
        <FileSpreadsheet className="size-4 text-emerald-600" />
        Caja del mes en Excel
      </div>
    </div>
  );
}
