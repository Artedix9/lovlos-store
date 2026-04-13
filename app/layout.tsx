import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LOVLOS — GOOD VIBES DEFINED",
    template: "%s — LOVLOS",
  },
  description:
    "High-end streetwear engineered for the vibe. Based in Tanzania, designed for the world.",
  metadataBase: new URL("https://lovlos.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "LOVLOS",
    title: "LOVLOS — GOOD VIBES DEFINED",
    description:
      "High-end streetwear engineered for the vibe. Based in Tanzania, designed for the world.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LOVLOS — GOOD VIBES DEFINED",
    description:
      "High-end streetwear engineered for the vibe. Based in Tanzania, designed for the world.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
