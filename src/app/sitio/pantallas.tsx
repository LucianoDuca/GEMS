import Image from "next/image";
import { CalendarDays, CalendarPlus, ClipboardPlus, House, MessageCircle, Phone, Search, TriangleAlert, UserPlus, Users, Wallet, Zap, CircleUserRound, Waves, Settings, HeartHandshake } from "lucide-react";
import { BarraEstado } from "./dispositivos";

// Pantallas de la app dibujadas a tamaño real, con datos de ejemplo, para los marcos de dispositivos.

// Escritorio (1280 × 832): el Inicio de la dueña.
export function PantallaEscritorio() {
  const nav = [
    { icono: House, texto: "Inicio" },
    { icono: CalendarDays, texto: "Agenda" },
    { icono: Users, texto: "Clientes" },
    { icono: Wallet, texto: "Caja" },
    { icono: Settings, texto: "Ajustes" },
  ];
  return (
    <div className="flex h-full bg-[#faf8fb] text-tinta">
      <aside className="flex w-[256px] shrink-0 flex-col bg-gradient-to-b from-lila via-lila to-lila-oscuro text-white">
        <div className="px-6 pb-6 pt-8"><Image src="/gems-logo-blanco.png" alt="" width={1200} height={276} className="h-auto w-36" /></div>
        <div className="mx-4 mb-4 rounded-2xl bg-white/10 px-4 py-3">
          <div className="text-xs tracking-wider text-white/70 uppercase">Centro</div>
          <div className="font-semibold">Estética Bellavista</div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ icono: Icono, texto }, i) => (
            <span key={texto} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold ${i === 0 ? "bg-white text-lila shadow-lg shadow-black/10" : "text-white/90"}`}>
              <Icono className="size-5" />{texto}
            </span>
          ))}
        </nav>
        <div className="m-3 mt-auto flex items-center gap-3 rounded-2xl bg-black/10 p-3">
          <CircleUserRound className="size-8 text-white/90" />
          <span><span className="block text-sm font-semibold">Marina</span><span className="block text-xs text-white/70">Dueña · Mi cuenta</span></span>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-5 px-10 py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lila via-lila to-lila-oscuro p-8 text-white">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-celeste/30 blur-3xl" />
          <p className="relative text-sm text-white/80">Jueves, 15 de octubre</p>
          <h1 className="relative mt-1 text-4xl font-bold tracking-tight">Buen día, Marina</h1>
          <p className="relative mt-1 text-white/85">¿A quién atendés ahora? Buscá por DNI o por nombre.</p>
          <div className="relative mt-5 flex gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-4 text-lg text-suave/70"><Search className="size-5 text-suave" />DNI o nombre…</div>
            <div className="flex items-center gap-2 rounded-2xl bg-celeste px-6 font-semibold"><Search className="size-5" />Buscar</div>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-celeste to-[#0078b0] p-5 text-white">
            <span className="grid size-14 place-items-center rounded-2xl bg-white/20"><UserPlus className="size-7" /></span>
            <span><span className="block text-lg font-bold">Alta de cliente</span><span className="text-sm text-white/85">Datos y ficha de salud</span></span>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
            <span className="grid size-14 place-items-center rounded-2xl bg-lila-claro text-lila"><Wallet className="size-7" /></span>
            <span><span className="block text-lg font-bold">Caja de hoy</span><span className="text-sm text-suave">Cobros y movimientos</span></span>
          </div>
        </div>
        <div className="grid grid-cols-[1.25fr_1fr] gap-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><span className="font-semibold">Turnos de hoy · 3 por atender</span><span className="text-sm font-semibold text-lila">Ver agenda</span></div>
            {[["10:00", "Valentina Paz", "Depilación", Zap, true], ["11:00", "Julieta Sosa", "Reductor", Waves, false], ["12:30", "Florencia Díaz", "Depilación", Zap, false]].map(([h, n, c, Icono, prox]) => {
              const I = Icono as typeof Zap;
              return (
                <div key={h as string} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${prox ? "bg-lila-claro" : ""}`}>
                  <span className="w-12 text-center text-sm font-bold">{h as string}</span>
                  <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-lila-claro to-celeste-claro text-sm font-bold text-lila">{(n as string).split(" ").map((p) => p[0]).join("")}</span>
                  <span className="flex-1"><span className="block font-semibold">{n as string}</span><span className="flex items-center gap-1 text-xs text-suave"><I className="size-3" />{c as string}</span></span>
                  <span className="rounded-xl bg-lila px-3 py-2 text-sm font-semibold text-white">Atender</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 font-semibold"><HeartHandshake className="size-5 text-lila" />Para contactar hoy</div>
            {[["Lucía García", "Turno mañana 15:00"], ["Carla Medina", "Le toca depilación"], ["Sofía Ruiz", "Cumple 32 años hoy"]].map(([n, d]) => (
              <div key={n} className="flex items-center gap-3 py-2.5">
                <span className="flex-1"><span className="block font-semibold">{n}</span><span className="text-xs text-suave">{d}</span></span>
                <span className="flex items-center gap-1.5 rounded-xl bg-[#25d366] px-3 py-2 text-sm font-semibold text-white"><MessageCircle className="size-4" />WhatsApp</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Celular (393 × 852): la ficha de una clienta.
export function PantallaCliente() {
  return (
    <div className="flex h-full flex-col bg-[#faf8fb] text-tinta">
      <div className="bg-gradient-to-br from-lila via-lila to-lila-oscuro pb-6 text-white">
        <BarraEstado clara />
        <div className="flex flex-col items-center px-5 pt-3 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-white/20 text-2xl font-bold shadow-[0_0_0_6px_rgba(255,255,255,0.12)]">VP</span>
          <h2 className="mt-3 text-2xl font-bold">Valentina Paz</h2>
          <p className="mt-1 text-sm text-white/80">DNI 38.412.977 · 34 años</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><Phone className="size-3.5" />261 555-0142</p>
        </div>
        <div className="mt-5 flex flex-col gap-2.5 px-5">
          <span className="flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] py-3.5 font-semibold"><MessageCircle className="size-5" />WhatsApp</span>
          <span className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-lila"><CalendarPlus className="size-5" />Registrar sesión</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff1e8] p-4 text-sm text-alerta">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span><b className="block">Revisar antes de tratar</b>Piel sensible · implante en tobillo</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-lila-claro p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-lila text-white"><CalendarDays className="size-5" /></span>
          <span><span className="block text-xs font-semibold tracking-wide text-lila uppercase">Próximo turno</span><span className="font-semibold">Martes 20 oct · 10:00</span></span>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 font-semibold">Sesiones por tratamiento</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-celeste-claro p-3"><div className="text-3xl font-bold text-celeste">8</div><div className="text-xs font-semibold">Depilación</div><div className="text-[11px] text-suave">Última: 2 oct</div></div>
            <div className="rounded-xl bg-lila-claro p-3"><div className="text-3xl font-bold text-lila">4</div><div className="text-xs font-semibold">Reductor</div><div className="text-[11px] text-suave">Última: 9 oct</div></div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-suave shadow-sm"><ClipboardPlus className="size-4" />Actualizar ficha de salud</div>
      </div>
    </div>
  );
}

// Marco de la app en el celular: barra de estado, encabezado y menú de abajo.
export function AppCelular({ activa, children }: { activa: "Inicio" | "Agenda" | "Clientes" | "Caja"; children: React.ReactNode }) {
  const items = [
    { icono: House, texto: "Inicio" },
    { icono: CalendarDays, texto: "Agenda" },
    { icono: Users, texto: "Clientes" },
    { icono: Wallet, texto: "Caja" },
    { icono: CircleUserRound, texto: "Cuenta" },
  ];
  return (
    <div className="flex h-full flex-col bg-[#faf8fb] text-tinta">
      <div className="bg-white/95">
        <BarraEstado />
        <div className="flex h-12 items-center gap-2.5 px-5">
          <Image src="/gems-diamante.png" alt="" width={512} height={512} className="size-7" />
          <span className="font-bold">Estética Bellavista</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5">{children}</div>
      <div className="flex h-[96px] bg-white/95 pb-[30px] shadow-[0_-1px_0_rgba(31,26,36,0.06)]">
        {items.map(({ icono: Icono, texto }) => (
          <span key={texto} className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold">
            <span className={`grid h-8 w-14 place-items-center rounded-full ${texto === activa ? "bg-lila text-white" : "text-suave"}`}><Icono className="size-5" /></span>
            <span className={texto === activa ? "text-lila" : "text-suave"}>{texto}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
