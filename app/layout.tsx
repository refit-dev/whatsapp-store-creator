import "../styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";

// Dynamically import non-critical components
const Analytics = dynamic(
  () =>
    import("@vercel/analytics/next").then((mod) => ({
      default: mod.Analytics,
    })),
  { ssr: false }
);
const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({
      default: mod.SpeedInsights,
    })),
  { ssr: false }
);
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "watzy",
  description: "Create your WhatsApp-powered store in minutes",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link
          rel="preconnect"
          href="https://iazdsuodmyymclqltenc.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://iazdsuodmyymclqltenc.supabase.co"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="dns-prefetch"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2X4PEF0W90"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2X4PEF0W90');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {children}
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
