import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "visuals",
  description: "a lightweight visualizer for Spotify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
