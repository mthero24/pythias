import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/Navbar";
import { NavigationProgress } from "@/components/NavigationProgress";
import { Providers } from "@/components/Providers";
import { FloatingChat } from "@pythias/backend";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "print oracle production",
  description: "Production Software for print oracle print shop",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{margin: 0, padding: 0}}
      >
        <Providers>
          <NavigationProgress />
          <NavBar />
          {children}
          <FloatingChat requiredRoles={["admin", "production", "manager"]} />
        </Providers>
      </body>
    </html>
  );
}
