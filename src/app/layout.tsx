import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import FeedbackButton from "@/components/molecules/FeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stallplass - Finn ledig stallplass for hesten din",
  description:
    "Norges største plattform for stallplasser. Finn ledig stallplass eller legg ut din egen stall for utleie.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <FeedbackButton />
        <Toaster />
        <SpeedInsights />
        <Script 
          src="https://cdn.counter.dev/script.js" 
          data-id="2f6b6146-e438-4e7d-9fb7-58d892c4b546" 
          data-utcoffset="2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
