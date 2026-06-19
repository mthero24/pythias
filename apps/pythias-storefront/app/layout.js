import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import CartModal from "@/components/cart/CartModal";
import QuickAddModal from "@/components/cart/QuickAddModal";
import CartDrawer from "@/components/cart/CartDrawer";
import { CustomerProvider } from "@/components/account/CustomerProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { ExperimentProvider } from "@/components/experiments/ExperimentProvider";
import HeaderControls from "@/components/HeaderControls";
import SaleBar from "@/components/SaleBar";
import SitePopup from "@/components/SitePopup";
import AnalyticsTracker from "@/components/analytics/tracker";
import { siteMetadata } from "@/lib/siteMeta";

// Site-level default metadata (full social/OpenGraph + Twitter cards) so EVERY route — including ones
// without their own generateMetadata (cart, checkout, account) — shares as the seller's brand.
export async function generateMetadata() {
    return siteMetadata();
}

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
                <I18nProvider>
                <ExperimentProvider>
                <CustomerProvider>
                    <FavoritesProvider>
                        <CartProvider>
                            <SaleBar />
                            <HeaderControls />
                            {children}
                            <SitePopup />
                            <CartModal />
                            <QuickAddModal />
                            <CartDrawer />
                            <AnalyticsTracker />
                        </CartProvider>
                    </FavoritesProvider>
                </CustomerProvider>
                </ExperimentProvider>
                </I18nProvider>
            </body>
        </html>
    );
}
