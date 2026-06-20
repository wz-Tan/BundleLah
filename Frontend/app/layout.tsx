import type { Metadata } from "next";
import AuthGate from "./components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "BundleLah",
  description: "BundleLah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={` h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
