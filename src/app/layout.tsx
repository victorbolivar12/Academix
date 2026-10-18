import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Acadexia — Tu aliado en cada entrega",
  description:
    "Acadexia es el sistema administrativo para el control de ganancias mensuales. Tu aliado en cada entrega.",
  keywords: ["Acadexia", "ganancias mensuales", "sistema administrativo"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
