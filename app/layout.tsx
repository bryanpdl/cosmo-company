import type { Metadata } from "next";
import { Oxanium } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from './context/GameContext';
import { SettingsProvider } from './context/SettingsContext';

const oxanium = Oxanium({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cosmo Co.",
  description: "A futuristic space factory idle game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${oxanium.className} bg-[#16141A] text-white min-h-screen`}>
        <AuthProvider>
          <SettingsProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
