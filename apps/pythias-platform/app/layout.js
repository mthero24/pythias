import "./globals.css";
import { AppThemeProvider } from "@/components/AppThemeProvider";

export const metadata = {
    title: "Pythias Platform",
    description: "Print fulfillment management platform",
    icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AppThemeProvider>
                    {children}
                </AppThemeProvider>
            </body>
        </html>
    );
}
