import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Shopify",
  description: "A prototype of the Shopify admin with Sidekick agents.",
  robots: { index: false, follow: false },
};

/** Phone / foldable friendly: device width, no forced desktop min, safe-area aware. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0d0c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`p-partial-theme-admin-next ${inter.variable}`}>
      <body className="antialiased">
        <Script src="https://cdn.shopify.com/shopifycloud/polaris-2.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
