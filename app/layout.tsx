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
  title: "LOVLOS — Good vibes defined.",
  description: "Premium clothing brand based in Tanzania. Discover LOVLOS — where style meets intention.",
  icons: {
    icon: "/favicon.ico",
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
