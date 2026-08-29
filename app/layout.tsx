import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leonardo Ureña | AI & Cybersecurity Portfolio",
  description:
    "Run Leonardo Ureña's interactive AI engineering demos: entity resolution, multi-agent RAG, evaluation, and ML drift monitoring.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
