
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nutrack9",
  description: "Track your daily food intake and mood.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
