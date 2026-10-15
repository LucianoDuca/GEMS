import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BellRing, Cake, Diamond, MapPin, MessageCircle, Plus, RotateCcw } from "lucide-react";
import { enlaceDemo, TELEFONO_VISIBLE } from "./contacto";
import { Contador, Encabezado, Inclinar, Revelar } from "./animaciones";
import { ComparadorPlanilla } from "./comparador";
import { Recorrido } from "./recorrido";
import { ChatWhatsApp } from "./chat";
import { IPhone, MacBook } from "./dispositivos";
import { PantallaCliente, PantallaEscritorio } from "./pantallas";

export const metadata: Metadata = {
  title: "GEMS Gestión · El sistema para centros de estética",
  description:
    "Fichas de salud firmadas, historial de sesiones, agenda por operadora, caja con reportes y recordatorios por WhatsApp. El sistema de gestión para centros de estética de Argentina.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "GEMS Gestión",
    description: "Cada clienta, cada sesión, en su lugar. El sistema para centros de estética.",
    images: ["/gems-logo.png"],
    locale: "es_AR",
    type: "website",
  },
};

const PREGUNTAS = [
  { p: "¿Tengo que instalar algo?", r: "No. Funciona en el navegador de la computadora, la tablet o el celular. En el celular se agrega a la pantalla de inicio y se usa como cualquier app." },
  { p: "Hoy uso Google Forms y planillas. ¿Pierdo lo que tengo?", r: "No. Importamos tus planillas de fichas de salud y de seguimiento de sesiones, así arrancás con todo el historial de tus clientas desde el primer día." },
  { p: "¿Es difícil para mi equipo?", r: "Está pensado para usarse sin capacitación larga: botones grandes, pasos guiados y un tutorial dentro de la app. Igual te acompañamos en el arranque." },
  { p: "¿Quién ve los datos de mis clientas?", r: "Solo tu centro. Cada estética tiene su espacio separado, las fichas de salud y las fotos no las ve nadie más —tampoco GEMS— y cada cambio queda registrado." },
  { p: "Tengo más de un local. ¿Sirve?", r: "Sí. Cada sucursal tiene su agenda y su caja, y la dueña cambia entre ellas y ve el resumen de todas juntas." },
  { p: "¿Qué pasa si un mes no pago?", r: "Te avisamos antes del vencimiento. Si el servicio se suspende, tus datos quedan guardados y vuelve a funcionar apenas se registra el pago." },
];

const MARQUESINA = ["Ficha de salud", "Firma en pantalla", "Mapa del cuerpo", "Agenda por operadora", "Recordatorios por WhatsApp", "Caja con reportes", "Fotos antes y después", "Sucursales"];

export default function Sitio() {
  const demo = enlaceDemo();

  return (
    <div className="sitio overflow-x-clip bg-white text-tinta">
      <Encabezado demo={demo} />

      <main>
        {/* ───────── 1. Portada: oscura, con aurora ───────── */}
        <section className="relative isolate overflow-hidden bg-[#141018] pb-24 pt-36 text-white sm:pt-44 lg:pb-32">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="aurora aurora-1" />
            <div className="aurora aurora-2" />
            <div className="aurora aurora-3" />
            <div className="grano absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#141018]" />
          </div>
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="aparecer-suave text-sm font-medium tracking-[0.2em] text-white/55 uppercase">GEMS Gestión · para centros de estética</p>
              <h1 className="mt-6 font-serif text-[3.4rem] leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.6rem]">
                <Palabras texto="Cada clienta," />
                <br />
                <Palabras texto="cada sesión," desde={2} />
                <br />
                <span className="italic text-[#e7b7d6]"><Palabras texto="en su lugar." desde={4} /></span>
              </h1>
              <p className="aparecer-suave mt-8 max-w-xl text-lg leading-relaxed text-white/65" style={{ animationDelay: "700ms" }}>
                Fichas de salud firmadas, historial de cada clienta, agenda, caja y recordatorios por WhatsApp. Todo lo que hoy está repartido entre planillas, formularios y un cuaderno, en una sola app.
              </p>
              <div className="aparecer-suave mt-10 flex flex-col gap-4 sm:flex-row sm:items-center" style={{ animationDelay: "850ms" }}>
                <a href={demo} target="_blank" rel="noopener noreferrer" className="boton-brillo inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-tinta transition hover:bg-lila-claro">
                  Pedí una demo
                  <ArrowUpRight className="size-5" aria-hidden />
                </a>
                <a href="#producto" className="group inline-flex items-center justify-center gap-2 px-2 py-4 font-semibold text-white/80 hover:text-white">
                  Ver cómo funciona
                  <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden />
                </a>
              </div>
            </div>
            <Inclinar className="aparecer-suave">
              <Maqueta />
            </Inclinar>
          </div>
        </section>

        {/* ───────── 2. Marquesina ───────── */}
        <section aria-label="Lo que incluye" className="overflow-hidden bg-lila py-5 text-white">
          <div className="marquesina flex w-max gap-10">
            {[...MARQUESINA, ...MARQUESINA].map((t, i) => (
              <span key={i} className="flex shrink-0 items-center gap-10 font-serif text-2xl italic sm:text-3xl">
                {t}
                <Diamond className="size-4 fill-white/70 text-white/70" aria-hidden />
              </span>
            ))}
          </div>
        </section>

        {/* ───────── 3. Antes y después ───────── */}
        <section className="py-28 sm:py-36">
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Revelar>
                <h2 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                  Las planillas no fueron hechas para <span className="italic text-lila">una estética.</span>
                </h2>
              </Revelar>
              <Revelar retraso={120}>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-suave">
                  Una pestaña para la ficha, otra para las sesiones, un DNI escrito de tres formas distintas. Deslizá la línea y mirá la misma clienta en GEMS.
                </p>
              </Revelar>
              <dl className="mt-12 flex flex-col gap-7">
                {[
                  ["Antes", "Buscar fila por fila cuántas sesiones lleva.", "Ahora", "Lo ves al instante, por tratamiento."],
                  ["Antes", "Las alertas de salud quedan en un formulario.", "Ahora", "Aparecen antes de cada sesión."],
                ].map(([a, antes, b, ahora], i) => (
                  <Revelar key={antes} retraso={200 + i * 120}>
                    <div className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1 text-[0.95rem]">
                      <dt className="text-suave/70">{a}</dt>
                      <dd className="text-suave line-through decoration-suave/40">{antes}</dd>
                      <dt className="font-semibold text-lila">{b}</dt>
                      <dd className="font-semibold">{ahora}</dd>
                    </div>
                  </Revelar>
                ))}
              </dl>
            </div>
            <Revelar efecto="escala">
              <ComparadorPlanilla />
            </Revelar>
          </div>
        </section>

        {/* ───────── 4. El producto, paso a paso ───────── */}
        <section id="producto" className="scroll-mt-20 bg-[#faf5f8] py-28 sm:py-36">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Revelar>
              <p className="text-sm font-semibold tracking-[0.2em] text-lila uppercase">El producto</p>
              <h2 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
                Un día en el centro, <span className="italic">sin papeles.</span>
              </h2>
            </Revelar>
            <div className="mt-16 lg:mt-8">
              <Recorrido />
            </div>
          </div>
        </section>

        {/* ───────── 5. WhatsApp ───────── */}
        <section id="whatsapp" className="relative isolate scroll-mt-20 overflow-hidden bg-[#0b2f2b] py-28 text-white sm:py-36">
          <div aria-hidden className="absolute -right-40 top-10 -z-10 size-[40rem] rounded-full bg-[#25d366]/15 blur-[120px]" />
          <div className="mx-auto grid max-w-7xl items-center gap-20 px-5 sm:px-8 lg:grid-cols-2">
            <Revelar efecto="izquierda" className="order-2 lg:order-1">
              <ChatWhatsApp />
            </Revelar>
            <div className="order-1 lg:order-2">
              <Revelar>
                <p className="text-sm font-semibold tracking-[0.2em] text-[#7ee2a8] uppercase">Fidelización</p>
                <h2 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                  Clientas que vuelven, <span className="italic text-[#7ee2a8]">sin perseguirlas.</span>
                </h2>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/65">
                  Cada mañana, GEMS arma la lista de a quién escribirle. Tocás el botón, se abre WhatsApp con el mensaje escrito y apretás enviar.
                </p>
              </Revelar>
              <ul className="mt-12 flex flex-col gap-8">
                {[
                  { icono: BellRing, titulo: "Turnos de mañana", texto: "El recordatorio, con día y hora, para que nadie falte." },
                  { icono: RotateCcw, titulo: "A quién le toca volver", texto: "Según el tratamiento: depilación cada 5 semanas, reductor cada semana." },
                  { icono: Cake, titulo: "Cumpleaños", texto: "Un saludo a tiempo, que la clienta recuerda." },
                ].map(({ icono: Icono, titulo, texto }, i) => (
                  <Revelar key={titulo} retraso={150 + i * 120}>
                    <li className="flex gap-5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#25d366]/15 text-[#7ee2a8]"><Icono className="size-6" aria-hidden /></span>
                      <span>
                        <span className="block text-lg font-semibold">{titulo}</span>
                        <span className="mt-1 block text-white/60">{texto}</span>
                      </span>
                    </li>
                  </Revelar>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ───────── 6. Cifras ───────── */}
        <section className="py-28 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-16 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            {[
              { valor: 3, sufijo: " min", texto: "para dar de alta a una clienta, con la ficha firmada." },
              { valor: 1, sufijo: " toque", texto: "para recordarle el turno por WhatsApp." },
              { valor: 12, sufijo: "", texto: "conceptos de caja listos: sueldos, impuestos, insumos…" },
              { valor: 0, sufijo: " planillas", texto: "Todo el centro en un mismo lugar." },
            ].map((c, i) => (
              <Revelar key={c.texto} retraso={i * 100}>
                <div className="font-serif text-7xl leading-none tracking-tight text-lila sm:text-8xl">
                  <Contador hasta={c.valor} sufijo={c.sufijo} />
                </div>
                <p className="mt-4 max-w-[16rem] text-suave">{c.texto}</p>
              </Revelar>
            ))}
          </div>
        </section>

        {/* ───────── 7. Seguridad ───────── */}
        <section id="seguridad" className="relative isolate scroll-mt-20 overflow-hidden bg-[#141018] py-28 text-white sm:py-36">
          <div aria-hidden className="grano absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-[1fr_1fr]">
            <Revelar>
              <p className="text-sm font-semibold tracking-[0.2em] text-celeste uppercase">Privacidad</p>
              <h2 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                Las fichas son de tu centro. <span className="italic text-white/50">De nadie más.</span>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">Una ficha de salud es información sensible. GEMS está construido para cuidarla desde el primer día.</p>
            </Revelar>
            <ol className="flex flex-col">
              {[
                ["Cada centro, su espacio.", "Ningún otro centro puede ver tus clientas. Tampoco GEMS accede a las fichas ni a las fotos."],
                ["Cada persona, su usuario.", "La dueña decide quién entra y qué puede hacer cada integrante del equipo."],
                ["Nada se borra a escondidas.", "Las sesiones y los cobros se anulan con un motivo, y cada cambio queda registrado."],
                ["Todo viaja cifrado.", "Se guarda en servidores profesionales en la nube, no en una computadora del local."],
              ].map(([titulo, texto], i) => (
                <Revelar key={titulo} retraso={i * 110}>
                  <li className="grid grid-cols-[3.5rem_1fr] gap-4 py-7">
                    <span className="font-serif text-3xl italic text-celeste">0{i + 1}</span>
                    <span>
                      <span className="block text-xl font-semibold">{titulo}</span>
                      <span className="mt-2 block leading-relaxed text-white/55">{texto}</span>
                    </span>
                  </li>
                </Revelar>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── 8. Cómo empezar ───────── */}
        <section id="empezar" className="scroll-mt-20 bg-gradient-to-b from-[#eef7fc] to-white py-28 sm:py-36">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Revelar>
              <h2 className="max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
                De las planillas a GEMS, <span className="italic text-celeste">en pocos días.</span>
              </h2>
            </Revelar>
            <div className="relative mt-20">
              <Revelar efecto="aparecer" className="absolute left-0 right-0 top-[1.4rem] hidden lg:block">
                <div className="linea-dibujar h-0.5 bg-gradient-to-r from-celeste via-lila to-lila/20" />
              </Revelar>
              <ol className="grid gap-14 lg:grid-cols-3 lg:gap-10">
                {[
                  ["Te damos de alta", "Creamos el espacio de tu centro con tus tratamientos, zonas, precios y equipo. Cada persona recibe su usuario."],
                  ["Traemos tu historial", "Importamos las fichas y las sesiones que tenías en Google Forms o Excel. No se pierde nada."],
                  ["Empezás a atender", "Buscás a la clienta, revisás sus alertas y registrás la sesión en menos de un minuto."],
                ].map(([titulo, texto], i) => (
                  <Revelar key={titulo} retraso={300 + i * 200}>
                    <li>
                      <span className="relative grid size-11 place-items-center rounded-full bg-white font-semibold text-lila shadow-[0_8px_24px_-8px_rgba(166,82,135,0.5)]">{i + 1}</span>
                      <h3 className="mt-8 font-serif text-3xl">{titulo}</h3>
                      <p className="mt-3 max-w-sm leading-relaxed text-suave">{texto}</p>
                    </li>
                  </Revelar>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ───────── 9. La marca ───────── */}
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-lila via-[#94487a] to-lila-oscuro py-28 text-white sm:py-40">
          <Image src="/gems-diamante-blanco.png" alt="" width={512} height={512} aria-hidden className="diamante-girar absolute -right-24 top-1/2 -z-10 size-[30rem] -translate-y-1/2 opacity-[0.08] sm:size-[38rem]" />
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <Revelar efecto="escala">
              <Image src="/gems-diamante-blanco.png" alt="" width={512} height={512} className="mx-auto size-14" />
            </Revelar>
            <Revelar retraso={120}>
              <blockquote className="mt-10 font-serif text-4xl leading-[1.1] tracking-tight sm:text-6xl">
                Te acompañamos desde el equipamiento. Ahora, también <span className="italic">en todo lo demás.</span>
              </blockquote>
            </Revelar>
            <Revelar retraso={240}>
              <p className="mx-auto mt-8 max-w-xl text-lg text-white/70">GEMS Gestión es de GEMS, la marca de equipamiento médico-estético. Conocemos cómo trabaja una estética porque estamos en ella todos los días.</p>
            </Revelar>
          </div>
        </section>

        {/* ───────── 10. Preguntas ───────── */}
        <section id="preguntas" className="scroll-mt-20 py-28 sm:py-36">
          <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <Revelar>
              <div className="lg:sticky lg:top-32">
                <h2 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">Preguntas <span className="italic text-lila">frecuentes</span></h2>
                <p className="mt-6 max-w-sm text-lg text-suave">¿Te quedó alguna duda? Escribinos por WhatsApp.</p>
                <a href={demo} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3.5 font-semibold text-white transition hover:brightness-95">
                  <MessageCircle className="size-5" aria-hidden />
                  Escribinos
                </a>
              </div>
            </Revelar>
            <div className="flex flex-col gap-3">
              {PREGUNTAS.map(({ p, r }, i) => (
                <Revelar key={p} retraso={i * 60}>
                  <details className="group rounded-3xl bg-[#f7f3f6] px-6 py-5 transition-colors open:bg-lila-claro sm:px-8 sm:py-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                      {p}
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-lila transition duration-300 group-open:rotate-45">
                        <Plus className="size-5" aria-hidden />
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl leading-relaxed text-suave">{r}</p>
                  </details>
                </Revelar>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── 11. Cierre ───────── */}
        <section className="px-3 pb-3 sm:px-5 sm:pb-5">
          <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-lila via-[#8f4576] to-[#5e2a4c] px-6 py-24 text-center text-white sm:py-32">
            <div aria-hidden className="absolute inset-0 -z-10">
              <div className="aurora aurora-2" />
              <div className="aurora aurora-3" />
              <div className="grano absolute inset-0" />
            </div>
            <Revelar>
              <h2 className="font-serif text-6xl leading-[0.98] tracking-tight sm:text-8xl">
                ¿Lo vemos en <span className="italic text-[#ffd9ef]">tu centro?</span>
              </h2>
            </Revelar>
            <Revelar retraso={150}>
              <p className="mx-auto mt-8 max-w-lg text-lg text-white/65">Te mostramos GEMS funcionando con un ejemplo real, en pocos minutos. Sin compromiso.</p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href={demo} target="_blank" rel="noopener noreferrer" className="boton-brillo inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-tinta transition hover:bg-lila-claro">
                  <MessageCircle className="size-5" aria-hidden />
                  Pedí tu demo por WhatsApp
                </a>
                <Link href="/login" className="inline-flex items-center gap-2 px-4 py-4 font-semibold text-white/70 hover:text-white">Ya tengo cuenta <ArrowRight className="size-5" aria-hidden /></Link>
              </div>
            </Revelar>
          </div>
        </section>
      </main>

      {/* ───────── Pie ───────── */}
      <footer className="relative overflow-hidden bg-[#141018] pt-24 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Image src="/gems-logo-blanco.png" alt="GEMS" width={1200} height={276} className="h-auto w-36" />
              <p className="mt-6 max-w-xs leading-relaxed text-white/55">El sistema de gestión para centros de estética. Fichas, sesiones, agenda, caja y fidelización en un solo lugar.</p>
              <a href={demo} target="_blank" rel="noopener noreferrer" className="boton-brillo mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-tinta transition hover:bg-lila-claro">
                Pedí una demo
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
            <ColumnaPie titulo="Producto" enlaces={[["Cómo funciona", "#producto"], ["Fidelización por WhatsApp", "#whatsapp"], ["Seguridad", "#seguridad"], ["Cómo empezar", "#empezar"], ["Preguntas frecuentes", "#preguntas"]]} />
            <ColumnaPie titulo="Cuenta" enlaces={[["Ingresar al sistema", "/login"], ["Pedí una demo", demo]]} />
            <div>
              <h3 className="text-sm font-semibold tracking-[0.15em] text-white/35 uppercase">Contacto</h3>
              <ul className="mt-5 flex flex-col gap-3 text-white/70">
                <li>
                  <a href={demo} target="_blank" rel="noopener noreferrer" className="subrayado inline-flex items-center gap-2 hover:text-white">
                    <MessageCircle className="size-4 text-[#25d366]" aria-hidden />
                    {TELEFONO_VISIBLE}
                  </a>
                </li>
                <li>Mendoza, Argentina</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 flex flex-col gap-3 py-8 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} GEMS · Equipamiento médico-estético.</p>
            <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden />Hecho en Mendoza para estéticas de todo el país.</p>
          </div>
        </div>
        <p aria-hidden className="pointer-events-none -mb-[0.2em] select-none bg-gradient-to-b from-white/[0.09] to-transparent bg-clip-text text-center font-serif text-[27vw] leading-none tracking-tighter text-transparent">GEMS</p>
      </footer>

      {/* WhatsApp flotante */}
      <a href={demo} target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp" className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-6px_rgba(37,211,102,0.6)] transition hover:scale-105">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-25 [animation-duration:2.5s]" aria-hidden />
        <MessageCircle className="relative size-7" aria-hidden />
      </a>
    </div>
  );
}

// Título que entra palabra por palabra.
function Palabras({ texto, desde = 0 }: { texto: string; desde?: number }) {
  return (
    <>
      {texto.split(" ").map((p, i) => (
        <Fragment key={i}>
          <span className="palabra">
            <span style={{ animationDelay: `${(desde + i) * 90 + 150}ms` }}>{p}</span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

function ColumnaPie({ titulo, enlaces }: { titulo: string; enlaces: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-[0.15em] text-white/35 uppercase">{titulo}</h3>
      <ul className="mt-5 flex flex-col gap-3 text-white/70">
        {enlaces.map(([texto, href]) => (
          <li key={texto}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="subrayado hover:text-white">{texto}</a>
            ) : (
              <a href={href} className="subrayado hover:text-white">{texto}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Portada: la app en una MacBook y la ficha de una clienta en un iPhone, con una notificación de WhatsApp.
function Maqueta() {
  return (
    <div className="relative mx-auto w-full max-w-[40rem] pb-[16%] lg:max-w-none">
      <MacBook className="w-full">
        <PantallaEscritorio />
      </MacBook>
      <IPhone className="absolute bottom-0 right-[1%] w-[26%] sm:-right-[2%] lg:-left-[6%] lg:right-auto">
        <PantallaCliente />
      </IPhone>
      <div aria-hidden className="maqueta-flotar-2 absolute left-[2%] top-[52%] w-[64%] max-w-[19rem] sm:w-[46%] lg:left-[16%] lg:top-[50%] lg:w-[44%]">
        <div className="flex items-start gap-3 rounded-[1.4rem] bg-white/85 p-3 text-tinta shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <span className="grid size-9 shrink-0 place-items-center rounded-[0.6rem] bg-[#25d366] text-white"><MessageCircle className="size-5" /></span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex justify-between text-[11px] text-suave"><span className="tracking-wide uppercase">WhatsApp</span><span>ahora</span></span>
            <span className="mt-0.5 block text-sm font-semibold">Lucía García</span>
            <span className="block truncate text-sm text-tinta/80">¡Sí, ahí estoy mañana! 🙌</span>
          </span>
        </div>
      </div>
    </div>
  );
}
