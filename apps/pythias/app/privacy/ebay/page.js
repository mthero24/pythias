import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import Link from "next/link";

export const metadata = {
    title: "eBay Integration Privacy Policy",
    description: "Privacy Policy for the Pythias Technologies eBay integration — how we access, use, and protect your eBay seller data.",
    alternates: { canonical: "https://pythiastechnologies.com/privacy/ebay" },
};

const EFFECTIVE_DATE = "May 30, 2025";

const Section = ({ title, children }) => (
    <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 1.5 }}>
            {title}
        </Typography>
        {children}
    </Box>
);

const P = ({ children }) => (
    <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem", mb: 1.5 }}>
        {children}
    </Typography>
);

const Li = ({ children }) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 0.75 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#E53238", flexShrink: 0, mt: 1 }} />
        <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem" }}>{children}</Typography>
    </Stack>
);

export default function EbayPrivacyPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>

            {/* Header */}
            <Box sx={{
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 8, md: 10 },
                position: "relative",
                overflow: "hidden",
            }}>
                <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(229,50,56,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E53238", mb: 2 }}>
                        Legal · eBay Integration
                    </Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        eBay Integration Privacy Policy
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem" }}>
                        Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Pythias Technologies, LLC
                    </Typography>
                </Container>
            </Box>

            {/* Body */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>

                    <P>
                        This Privacy Policy describes how Pythias Technologies, LLC (&quot;Pythias,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
                        collects, uses, and protects data accessed through the eBay Sell API when you connect your eBay seller
                        account to the Pythias platform. This policy applies specifically to the eBay integration and supplements
                        our{" "}
                        <Box component={Link} href="/privacy" sx={{ color: "#E53238", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                            general Privacy Policy
                        </Box>.
                    </P>

                    <Divider sx={{ my: 4 }} />

                    <Section title="1. Data We Access via eBay API">
                        <P>
                            When you authorize Pythias to connect to your eBay seller account via OAuth, we request access to
                            the following data through the eBay Sell API:
                        </P>
                        <Box sx={{ mb: 2 }}>
                            <Li><strong>Orders &amp; Fulfillment</strong> — open orders, line items, buyer shipping addresses, and order status</Li>
                            <Li><strong>Inventory &amp; Listings</strong> — inventory items, offers, pricing, and available quantity</Li>
                            <Li><strong>Account Settings</strong> — fulfillment policies, payment policies, and return policies (read-only)</Li>
                            <Li><strong>Seller Analytics</strong> — seller standards profile and traffic report data (read-only)</Li>
                            <Li><strong>Finances</strong> — transaction history and payout records</Li>
                            <Li><strong>Messages</strong> — buyer-seller conversations and message threads</Li>
                            <Li><strong>Feedback &amp; Reputation</strong> — received feedback scores and comments</Li>
                            <Li><strong>Payment Disputes</strong> — dispute summaries and detail records</Li>
                            <Li><strong>Marketing</strong> — ad campaigns and promotional listings</Li>
                            <Li><strong>Store</strong> — eBay store profile and category information</Li>
                            <Li><strong>Seller Identity</strong> — eBay username, account type, and account status (read-only)</Li>
                        </Box>
                        <P>
                            We access only the data categories needed to provide the services you use within the Pythias
                            dashboard. We do not access buyer payment card data or any data outside the scopes listed above.
                        </P>
                    </Section>

                    <Section title="2. How We Use eBay Data">
                        <P>Data accessed via the eBay API is used exclusively to provide and operate the Pythias fulfillment platform:</P>
                        <Li>Pulling unfulfilled orders into your production queue for print-on-demand fulfillment</Li>
                        <Li>Submitting shipment confirmations and tracking numbers back to eBay on your behalf</Li>
                        <Li>Displaying order, listing, analytics, finance, message, feedback, dispute, and marketing data in your Pythias dashboard</Li>
                        <Li>Allowing you to update listing prices and inventory quantities through the dashboard</Li>
                        <Li>Allowing you to reply to buyer messages through the dashboard</Li>
                        <P>
                            We do not use your eBay data for advertising, sell it to third parties, or use it for any purpose
                            other than operating the features you have enabled.
                        </P>
                    </Section>

                    <Section title="3. OAuth Authorization &amp; Tokens">
                        <P>
                            Connecting your eBay account uses eBay&apos;s OAuth 2.0 authorization framework. When you authorize
                            the Pythias application:
                        </P>
                        <Li>You are redirected to eBay&apos;s secure sign-in page — Pythias never sees your eBay password</Li>
                        <Li>eBay issues us an access token and refresh token scoped to the permissions you granted</Li>
                        <Li>Tokens are stored encrypted in our database and used only to make API calls on your behalf</Li>
                        <Li>You may revoke access at any time from your eBay account settings under My eBay → Account → Site Preferences → Third-party authorizations</Li>
                        <Box sx={{ mt: 1.5 }}>
                            <P>Revoking access immediately invalidates our tokens and stops all API activity for your account.</P>
                        </Box>
                    </Section>

                    <Section title="4. Data Storage &amp; Security">
                        <P>
                            eBay data retrieved through the API is stored in our MongoDB Atlas database hosted in the United States.
                            Access is restricted to authenticated Pythias platform users with appropriate permissions. We use
                            HTTPS/TLS for all data transmission and enforce access controls at the application level.
                        </P>
                        <P>
                            OAuth tokens are stored in our database and rotated automatically per eBay&apos;s token refresh
                            requirements. We do not log or store raw API responses beyond what is needed to display data in
                            your dashboard.
                        </P>
                    </Section>

                    <Section title="5. Data Retention">
                        <P>
                            Order and fulfillment data is retained for up to 24 months to support shipping history and dispute
                            resolution. Analytics and finance data displayed in the dashboard is fetched live from eBay on
                            demand and not stored persistently by Pythias. OAuth tokens are retained until you disconnect
                            your account or revoke authorization via eBay. Upon disconnection, tokens are deleted from our
                            database within 30 days.
                        </P>
                    </Section>

                    <Section title="6. Data Sharing">
                        <P>
                            We do not sell or share your eBay data with any third party for marketing or advertising purposes.
                            Your eBay data may be accessed by:
                        </P>
                        <Li><strong>Pythias platform operators</strong> — authorized staff operating your account at your direction</Li>
                        <Li><strong>Infrastructure providers</strong> — MongoDB Atlas (database hosting) and Vercel (application hosting), under confidentiality agreements</Li>
                        <Li><strong>Legal authorities</strong> — only if required by applicable law, court order, or governmental authority</Li>
                    </Section>

                    <Section title="7. eBay API Compliance">
                        <P>
                            Our use of the eBay API is governed by the{" "}
                            <Box component="a" href="https://developer.ebay.com/api-docs/static/ebay-rest-api-terms.html" target="_blank" rel="noopener noreferrer"
                                sx={{ color: "#E53238", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                eBay API License Agreement
                            </Box>{" "}
                            and the eBay Developer Program policies. We request only the minimum OAuth scopes needed for the
                            features we provide. We do not use eBay data to compete with eBay or in any manner prohibited by
                            the eBay API terms.
                        </P>
                    </Section>

                    <Section title="8. Your Rights">
                        <P>As an eBay seller using the Pythias integration, you have the right to:</P>
                        <Li>Disconnect your eBay account from Pythias at any time from the integrations dashboard</Li>
                        <Li>Request deletion of any eBay data we have stored by contacting us at the address below</Li>
                        <Li>Request a copy of the eBay data we hold associated with your account</Li>
                        <Li>Revoke eBay OAuth authorization directly from your eBay account settings</Li>
                    </Section>

                    <Section title="9. Changes to This Policy">
                        <P>
                            We may update this policy as our eBay integration evolves. Material changes will be communicated
                            by updating the effective date above. Continued use of the eBay integration after changes
                            constitutes acceptance of the updated policy.
                        </P>
                    </Section>

                    <Section title="10. Contact Us">
                        <P>Questions about our eBay integration data practices:</P>
                        <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 3, p: 3, mt: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: "#111827", mb: 0.5 }}>Pythias Technologies, LLC</Typography>
                            <Typography sx={{ color: "#4b5563", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                                1421 Hidden View Drive, Lapeer MI 48446<br />
                                (844) 579-8442<br />
                                <Box component={Link} href="/contact"
                                    sx={{ color: "#E53238", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                    Contact Us
                                </Box>
                            </Typography>
                        </Box>
                    </Section>

                    <Divider sx={{ my: 4 }} />

                    <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem", textAlign: "center" }}>
                        © {new Date().getFullYear()} Pythias Technologies, LLC · All rights reserved ·{" "}
                        <Box component={Link} href="/privacy" sx={{ color: "#E53238", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                            General Privacy Policy
                        </Box>
                        {" "}·{" "}
                        <Box component={Link} href="/contact" sx={{ color: "#E53238", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                            Contact Us
                        </Box>
                    </Typography>

                </Box>
            </Container>
        </Box>
    );
}
