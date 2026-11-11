import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Allow every route to render per request: each response needs a fresh CSP nonce,
// which a prerendered static shell cannot carry (ADR-008).
export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobConnect",
  description:
    "A job marketplace with verified employers and real-time application tracking.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page renders per request so it gets a fresh CSP nonce (ADR-008).
  await connection();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
