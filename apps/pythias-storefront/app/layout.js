import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { CustomerProvider } from "@/components/account/CustomerProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import HeaderControls from "@/components/HeaderControls";
import SitePopup from "@/components/SitePopup";
import AnalyticsTracker from "@/components/analytics/tracker";

export const metadata = {
    title: "Pythias Storefront",
    description: "Powered by Pythias",
};

// Curated fonts used by the theme presets (keep in sync with packages/storefront/themes/presets.js).
const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="stylesheet" href={FONTS_HREF} />
            </head>
            <body>
                <CustomerProvider>
                    <FavoritesProvider>
                        <CartProvider>
                            <HeaderControls />
                            {children}
                            <SitePopup />
                            <AnalyticsTracker />
                        </CartProvider>
                    </FavoritesProvider>
                </CustomerProvider>
            </body>
        </html>
    );
}
