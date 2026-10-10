import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Silkscreen } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Terminal } from "@/components/terminal/Terminal";
import { site } from "@/data/portfolio";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const silkscreen = Silkscreen({
  subsets: ["latin"],
  variable: "--font-silkscreen",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  ...(site.url ? { metadataBase: new URL(site.url) } : {}),
  title: { default: site.title, template: "%s · ANISH.EXE" },
  description: site.description,
  applicationName: "ANISH.EXE",
  authors: [{ name: "Anish Karthikeyan" }],
  keywords: ["Anish Karthikeyan", "software engineer", "backend", "applied AI", "machine learning", "portfolio"],
  openGraph: {
    type: "website",
    title: site.title,
    description: site.description,
    siteName: "ANISH.EXE",
    ...(site.url ? { url: site.url } : {}),
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#101419",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${silkscreen.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <Terminal />
      </body>
    </html>
  );
}
