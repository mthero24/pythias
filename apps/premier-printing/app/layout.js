import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CSVProvider, FloatingChat, PageTracker, AnalyticsTracker } from "@pythias/backend";
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
            <PageTracker />
            <AnalyticsTracker />
            <Navbar />
            {children}
            <FloatingChat />
          </CSVProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
