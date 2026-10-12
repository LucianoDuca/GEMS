import Image from "next/image";
import { HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { FormularioLogin } from "./formulario";

const beneficios = [
  { icono: HeartPulse, texto: "Ficha de salud y alertas antes de cada tratamiento" },
  { icono: Sparkles, texto: "Historial y totales de sesiones al instante" },
  { icono: ShieldCheck, texto: "Datos protegidos: cada centro ve solo lo suyo" },
];

export default function PaginaLogin() {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-lila via-lila to-lila-oscuro p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-celeste/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10 blur-3xl" />
        <Image src="/gems-logo-blanco.png" alt="GEMS, equipamiento médico-estético" width={1200} height={276} priority className="relative h-auto w-56" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Tu centro de estética, ordenado y en un solo lugar.</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {beneficios.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-white/90">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icono className="size-5" aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <Image src="/gems-diamante-blanco.png" alt="" width={512} height={512} className="absolute -bottom-24 -right-24 size-96 opacity-10" />
      </section>

      <section className="flex items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-sm">
          <Image src="/gems-logo.png" alt="GEMS, equipamiento médico-estético" width={1200} height={276} priority className="mx-auto mb-10 h-auto w-52 lg:hidden" />
          <h1 className="text-3xl font-bold tracking-tight">Hola de nuevo</h1>
          <p className="mb-8 mt-2 text-suave">Ingresá con el email y la contraseña que te dio tu centro.</p>
          <FormularioLogin />
          <p className="mt-8 text-center text-xs text-suave">¿Olvidaste la contraseña? Pedile a la dueña de tu centro que te ponga una nueva desde Ajustes. Si sos la dueña, escribile a GEMS.</p>
        </div>
      </section>
    </main>
  );
}
