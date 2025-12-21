import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Safe TradeX",
  description: "Discipline tool for Indian options traders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 max-w-[1920px] mx-auto w-full px-3 lg:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
