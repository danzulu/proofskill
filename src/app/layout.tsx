import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProofSkill — Evidence over confidence",
    template: "%s · ProofSkill",
  },
  description:
    "A pressure-tested business assessment that turns decisions into verifiable evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={GeistSans.variable + " " + GeistMono.variable + " dark h-full"}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
