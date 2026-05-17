import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeRegistry from "./ThemeRegistry";
import {CSVProvider} from "@pythias/backend";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pythias - Test App",
  description: "Pythias - Test App",
  icons: {
    icon: "/pythias-logo--new-gold-50.png",
  },
};

export default function RootLayout({ children }) {
 
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeRegistry>
          <CSVProvider>
            <Navbar/>
            {children}
          </CSVProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
