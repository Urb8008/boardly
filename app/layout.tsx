import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boardly",
  description: "My Trello-style project management app",
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