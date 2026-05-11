import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Trimmed weight set — three weights for hierarchy, one for the headline.
const body = Jost({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
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
    <html lang="en" className={cn("h-full", "antialiased", "dark", body.variable, "font-sans")}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
