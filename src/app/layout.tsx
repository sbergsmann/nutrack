import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrack9",
  description: "Track your daily food intake and mood.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#F87171" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
