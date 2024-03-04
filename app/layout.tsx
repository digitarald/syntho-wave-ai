import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "../lib/configContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SynthoWave - AI-Synthesized Live Feedback and Conversations",
  description: "Copyright 2024 by Harald Kirschner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <ConfigProvider>{children}</ConfigProvider>
      </body>
    </html>
  );
}
