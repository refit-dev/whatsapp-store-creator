import "../styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import { AnalyticsWrapper } from "@/components/AnalyticsWrapper";

// Force dynamic rendering across the app to avoid static generation timeouts
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://www.watzy.app" />
        <link rel="preconnect" href="https://watzy.app" />
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
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

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
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
