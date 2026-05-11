import type { Metadata, Viewport } from "next";
import { Jost, Overpass_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Trimmed weight set — three weights for hierarchy, one for the headline.
const body = Jost({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-body",
  display: "swap",
});

const mono = Overpass_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hantawatch — live OSINT situation board",
  description:
    "Live worldwide hantavirus tracker. Aggregated from WHO Disease Outbreak News, the U.S. CDC, ArcGIS Hondius case tracker, GDELT 2.0, and Google News.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0612",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "dark", body.variable, mono.variable, "font-sans")}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
