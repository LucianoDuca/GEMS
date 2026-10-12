import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en cada navegación y manda al login a quien no está autenticado.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims);
  const enLogin = request.nextUrl.pathname.startsWith("/login");

  if (!autenticado && !enLogin) return redirigir(request, response, "/login");
  if (autenticado && enLogin) return redirigir(request, response, "/");

  return response;
}

// Una redirección tiene que llevar las cookies de sesión recién refrescadas.
function redirigir(request: NextRequest, response: NextResponse, ruta: string) {
  const redireccion = NextResponse.redirect(new URL(ruta, request.url));
  response.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}

export const config = {
  // Archivos públicos (imágenes, íconos, manifest de la app) pasan sin pedir login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|png|svg|ico|webmanifest)$).*)"],
};
