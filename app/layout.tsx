import type { Metadata } from "next";
import { Oxanium } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const oxanium = Oxanium({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Space Factory Tycoon",
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
