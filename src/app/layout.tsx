import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Excel to Folder Generator - Excel Dosyalarından Klasör Yapısı Oluştur",
  description:
    "Excel dosyalarınızdan otomatik klasör yapıları oluşturan ve zip olarak indirmenizi sağlayan modern bir web uygulaması. Next.js, TypeScript ve Tailwind CSS ile geliştirildi.",
  keywords: [
    "excel",
    "folder",
    "generator",
    "zip",
    "next.js",
    "typescript",
    "tailwind css",
    "shadcn/ui",
  ],
  authors: [
    { name: "Barış Arıburnu", url: "https://github.com/barisariburnu" },
  ],
  openGraph: {
    title: "Excel to Folder Generator",
    description: "Excel dosyalarından otomatik klasör yapıları oluşturun",
    url: "https://github.com/barisariburnu/excel-folder-generator",
    siteName: "Excel to Folder Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to Folder Generator",
    description: "Excel dosyalarından otomatik klasör yapıları oluşturun",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
