import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SuiWalletProvider } from "../context/WalletContext";
import { NotificationProvider } from "../components/Notifications";
import MatrixRain from "../components/MatrixRain";
import DarkModeToggle from "../components/DarkModeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuiZkCred",
  description: "Privacy-preserving credential framework built on Sui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SuiWalletProvider>
            <NotificationProvider>
              <MatrixRain />
              <DarkModeToggle />
              {children}
            </NotificationProvider>
          </SuiWalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
