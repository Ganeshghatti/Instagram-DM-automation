import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Meta Developers — Instagram Auto-DM Console",
  description: "Graph API v25.0 Webhook & Private Reply Automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body
        style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        className="bg-[#F0F2F5] text-[#1C1E21] antialiased"
      >
        {children}
      </body>
    </html>
  );
}