import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import "./globals.css";

const title = "Leonardo Urena | AI/ML Engineer & Lead Data Scientist";
const description =
  "Lead Data Scientist and AI/ML engineer building production agentic AI, RAG, LLM evaluation, ML pipelines, and data platforms. Five live, interactive labs.";
const ogImage = { url: "/og-image.png", width: 1200, height: 630, alt: "Leonardo Urena, AI/ML Engineer and Lead Data Scientist" };

export const metadata: Metadata = {
  metadataBase: new URL("https://www.leonardo-urena.com"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Leonardo Urena",
    title,
    description,
    images: [ogImage],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#010102",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Self-hosted Geist (public/fonts, declared in globals.css). Preloading the latin subset avoids a late font swap.
  preload("/fonts/geist-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
