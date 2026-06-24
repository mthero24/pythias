import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import Link from "next/link";

export const metadata = {
    title: "Etsy Integration — Pythias Technologies",
    description:
        "How Pythias connects to your own Etsy shop to manage your listings and automate your order fulfillment and tracking. Per-seller authorization, minimal scopes, and no transfer of Etsy member data to third parties.",
    alternates: { canonical: "https://pythiastechnologies.com/integrations/etsy" },
};

const GOLD = "#D3A73D";
const UPDATED = "June 23, 2026";

const Section = ({ number, title, children }) => (
    <Box sx={{ mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #D3A73D, #b88a2a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Typography sx={{ color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>{number}</Typography>
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.25rem" }}>{title}</Typography>
        </Box>
        {children}
    </Box>
);

const P = ({ children }) => <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem", mb: 1.5 }}>{children}</Typography>;
const Li = ({ children }) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 0.75 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#D3A73D", flexShrink: 0, mt: 1 }} />
        <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem" }}>{children}</Typography>
    </Stack>
);

export default function EtsyIntegrationPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Box sx={{ background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)", py: { xs: 8, md: 10 }, position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}>Integration</Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        Etsy Integration
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: { xs: "1rem", md: "1.125rem" }, maxWidth: 620 }}>
                        Connect your own Etsy shop to manage your listings, fulfill your orders, and send tracking from one place — so you publish faster and your buyers get made-on-time orders with accurate delivery updates.
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8125rem", mt: 2 }}>Last updated {UPDATED} · Pythias Technologies, LLC</Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>
                    <P>Pythias Technologies, LLC ("Pythias") builds and operates a production and fulfillment platform that we own directly. Sellers use Pythias as their fulfillment vendor — the service that produces and ships their orders. This page explains exactly how our Etsy integration works and how we handle Etsy data, so both sellers and Etsy can see precisely what we do and do not do.</P>
                    <Divider sx={{ my: 4 }} />

                    <Section number="1" title="What the integration does">
                        <P>An Etsy seller who uses Pythias connects their own shop so they can manage their listings and have their orders produced, shipped, and tracked from one place. Specifically, for a connected shop we:</P>
                        <Li>Create and update that seller&apos;s own product listings on their Etsy shop, from product details they enter in Pythias.</Li>
                        <Li>Retrieve that seller&apos;s incoming Etsy orders so our production team can make and ship them.</Li>
                        <Li>Write shipment and tracking information back to that seller&apos;s Etsy shop, so their buyers receive accurate delivery updates.</Li>
                        <P>This is the same kind of seller tool an Etsy shop owner already uses to list products and the same relationship they have with a print or shipping provider: Pythias acts on the seller&apos;s behalf, for the seller&apos;s own shop.</P>
                    </Section>

                    <Section number="2" title="You authorize your own shop">
                        <Li>Access is granted by the seller, for their own shop, through Etsy&apos;s standard OAuth consent screen — we never access a shop the owner has not explicitly connected.</Li>
                        <Li>You can review the permissions before granting them, and you can revoke Pythias&apos;s access at any time from your Etsy account settings.</Li>
                        <Li>Each connection is independent. We do not aggregate, cross-reference, or expose one shop&apos;s data to another.</Li>
                    </Section>

                    <Section number="3" title="Minimum permissions (scopes) we request">
                        <P>We request only the scopes needed to manage your listings and fulfill your orders — nothing more:</P>
                        <Li><b>Manage your listings</b> (<code>listings_r</code>, <code>listings_w</code>, <code>listings_d</code>) — to create, update, and remove your own product listings when you publish or change them in Pythias.</Li>
                        <Li><b>Read orders</b> (<code>transactions_r</code>) — to retrieve the orders we need to produce and ship.</Li>
                        <Li><b>Submit tracking</b> (<code>transactions_w</code>) — to mark orders shipped and post tracking back to your shop.</Li>
                        <P>We do not request access to messaging, billing, or any data we do not need to manage your listings and fulfill your orders.</P>
                    </Section>

                    <Section number="4" title="How we handle Etsy data">
                        <P>We take Etsy&apos;s API Terms of Use seriously and have designed the integration to comply with them.</P>
                        <Li><b>We use it only to run your shop for you.</b> Listing data is used solely to publish and update that seller&apos;s own listings, and order details and buyer shipping addresses are used solely to produce, package, ship, and provide tracking for that seller&apos;s own orders.</Li>
                        <Li><b>We do not sell, lease, or transfer Etsy data.</b> In line with Etsy&apos;s API Terms of Use, we do not sell, lease, or otherwise transfer Etsy API access or Etsy member data to any third party.</Li>
                        <Li><b>Service providers act under our instruction.</b> Where infrastructure providers (e.g., hosting and shipping carriers) process data to deliver the service, they act solely on our instruction to fulfill your orders, not for their own purposes.</Li>
                        <Li><b>Security.</b> Credentials and tokens are stored encrypted, transmitted over TLS, and scoped to the connecting shop.</Li>
                        <Li><b>Retention.</b> We retain order data only as long as needed to fulfill orders, provide support, and meet legal/accounting obligations, after which it is deleted or anonymized.</Li>
                        <Li><b>Disconnecting.</b> When you revoke access or close your account, we stop pulling new orders and remove stored Etsy credentials.</Li>
                    </Section>

                    <Section number="5" title="Who operates this">
                        <P>The Pythias application is built and operated by Pythias Technologies, LLC. It is not submitted on behalf of, and does not provide API credentials to, any third-party application or company. Our customers are sellers who use Pythias to fulfill their own orders.</P>
                    </Section>

                    <Section number="6" title="More information">
                        <P>
                            For full details on how we process data, see our{" "}
                            <Box component={Link} href="/privacy" sx={{ color: GOLD, textDecoration: "none" }}>Privacy Policy</Box>,{" "}
                            <Box component={Link} href="/data-protection" sx={{ color: GOLD, textDecoration: "none" }}>Data Protection Policy</Box>, and{" "}
                            <Box component={Link} href="/terms" sx={{ color: GOLD, textDecoration: "none" }}>Terms of Service</Box>. Questions about this integration or our data handling? Contact us at{" "}
                            <Box component="a" href="mailto:support@pythiastechnologies.com" sx={{ color: GOLD, textDecoration: "none" }}>support@pythiastechnologies.com</Box>.
                        </P>
                        <P sx={{ fontSize: "0.8125rem", color: "#9ca3af" }}>The term &quot;Etsy&quot; is a trademark of Etsy, Inc. This integration uses the Etsy API but is not endorsed or certified by Etsy, Inc.</P>
                    </Section>
                </Box>
            </Container>
        </Box>
    );
}
