import type { Metadata, Viewport } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import "./globals.css";

const title = "Leonardo Urena | AI & Data Science Engineer";
const description =
  "Lead Cybersecurity Data Scientist and AI/ML Engineer building production machine learning, RAG, agentic AI, data platforms, and evaluation systems.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.leonardo-urena.com"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Leonardo Urena",
    title,
    description,
    images: [{ url: "/leonardo-urena-portrait.jpg", width: 640, height: 1147, alt: "Leonardo Urena Nikolova" }],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
