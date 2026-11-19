import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const display = Funnel_Display({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});

const text = Funnel_Sans({
  variable: "--font-text",
  subsets: ["latin"],
  display: "swap",
});

const mono = DM_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Reservy — prise de rendez-vous en ligne",
    template: "%s · Reservy",
  },
  description:
    "Partagez un lien, vos clients choisissent un créneau libre, vous confirmez. Agenda, rappels et synchronisation iCal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${display.variable} ${text.variable} ${mono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
