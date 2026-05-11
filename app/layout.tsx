import type { Metadata } from "next";
import { Inter_Tight, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const body = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hantawatch — live OSINT situation board",
  description:
    "Live worldwide hantavirus tracker. Aggregated from WHO Disease Outbreak News, the U.S. CDC, ArcGIS Hondius case tracker, GDELT 2.0, and Google News.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "dark", body.variable, "font-sans", geist.variable)}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
