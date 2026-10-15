import { Instrument_Serif } from "next/font/google";

// Tipografía de títulos de la página pública: una serif editorial, como las marcas de estética.
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });

export default function LayoutSitio({ children }: LayoutProps<"/sitio">) {
  return <div className={`${serif.variable} contents`}>{children}</div>;
}
