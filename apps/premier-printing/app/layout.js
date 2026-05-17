import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CSVProvider, FloatingChat, IdleLogout } from "@pythias/backend";
import { AppThemeProvider } from "@/components/AppThemeProvider";
import { NavigationProgress } from "@/components/NavigationProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Premier Printing",
  description: "Premier Printing",
  icons: {
    icon: "/premierprinting-favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppThemeProvider>
          <NavigationProgress />
          <CSVProvider>
            <Navbar />
            {children}
            <FloatingChat />
            <IdleLogout />
          </CSVProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
