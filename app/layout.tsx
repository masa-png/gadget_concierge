import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "./_components/shared/layout/header";
import { Footer } from "./_components/shared/layout/footer";
import { AuthProvider } from "./_components/shared/providers/auth-provider";
import { Toaster } from "sonner";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F3F7FC]`}
      >
        <AuthProvider>
          <Header />
          {children}
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "white",
                border: "1px solid #e5e7eb",
                color: "#374151",
                fontSize: "16px",
                padding: "16px",
              },
              className: "shadow-lg",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
