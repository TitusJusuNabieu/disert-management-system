import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Dissertation Record System — ${siteConfig.institution}`,
  description: `${siteConfig.department} Dissertation Record and Management System — ${siteConfig.institution}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full bg-gray-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
