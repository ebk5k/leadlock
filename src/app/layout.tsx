import type { ReactNode } from "react";
import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "LeadLock",
  description: "A customer acquisition and business automation system for local businesses."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
