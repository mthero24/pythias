import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import Link from "next/link";

export const metadata = {
    title: "Terms of Service — Pythias Technologies",
    description: "Terms of service for Pythias Fulfillment Cloud and Commerce Cloud platform users.",
    alternates: { canonical: "https://pythiastechnologies.com/terms" },
};

const GOLD = "#D3A73D";
const VERSION = "1.0";
const EFFECTIVE_DATE = "June 1, 2026";

const Section = ({ number, title, children }) => (
    <Box sx={{ mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #D3A73D, #b88a2a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Typography sx={{ color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>{number}</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>{title}</Typography>
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

export default function TermsPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Box sx={{ background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)", py: { xs: 8, md: 10 }, position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}>Legal</Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        Terms of Service
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem" }}>
                        Version {VERSION} · Effective {EFFECTIVE_DATE} · Pythias Technologies, LLC
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>
                    <P>These Terms of Service ("Terms") govern your access to and use of the Pythias Technologies platform, including Fulfillment Cloud and Commerce Cloud (collectively, the "Service"), provided by Pythias Technologies, LLC ("Pythias," "we," "us"). By creating an account or using the Service, you agree to these Terms.</P>
                    <Divider sx={{ my: 4 }} />

                    <Section number="1" title="Acceptance & Eligibility">
                        <P>You must be at least 18 years old and operating a legitimate business to use the Service. By accepting these Terms, you represent that you have the authority to bind your business to this agreement.</P>
                    </Section>

                    <Section number="2" title="Description of Service">
                        <P>Pythias provides software-as-a-service tools for print-on-demand and custom apparel operations, including:</P>
                        <Li>Order management and production queue software (Fulfillment Cloud)</Li>
                        <Li>Marketplace integrations and seller tools (Commerce Cloud)</Li>
                        <Li>Inventory management, shipping label generation, and analytics</Li>
                        <Li>Access to the Pythias fulfillment network (where available and eligible)</Li>
                    </Section>

                    <Section number="3" title="Subscription & Billing">
                        <Li>Subscriptions are billed monthly or annually in advance. Fees are non-refundable except as required by law.</Li>
                        <Li>Usage overages (orders, products, etc.) are billed at the rates specified in your plan.</Li>
                        <Li>For products sourced through the Pythias wholesale supplier network, Pythias places and pays the supplier order on your behalf and charges your wallet the listed cost plus applicable shipping. The listed cost may include a service margin over the supplier&apos;s wholesale price, which Pythias retains as compensation for sourcing, payment processing, and platform services.</Li>
                        <Li>We may update pricing with 30 days written notice. Continued use after the notice period constitutes acceptance.</Li>
                        <Li>Failure to pay may result in suspension of your account after a 7-day grace period.</Li>
                    </Section>

                    <Section number="4" title="Your Responsibilities">
                        <Li>You are responsible for the accuracy of your product listings, designs, pricing, and order data.</Li>
                        <Li>You must comply with all applicable laws, including consumer protection, intellectual property, and marketplace seller agreements.</Li>
                        <Li>You may not use the Service to process orders for counterfeit, infringing, or prohibited goods.</Li>
                        <Li>You are responsible for maintaining the security of your account credentials.</Li>
                    </Section>

                    <Section number="5" title="Intellectual Property">
                        <Li>You retain ownership of your designs, product content, and customer data.</Li>
                        <Li>You grant Pythias a limited license to process your data to provide the Service.</Li>
                        <Li>Pythias retains ownership of the platform, software, and all underlying technology.</Li>
                    </Section>

                    <Section number="6" title="Data & Privacy">
                        <P>Your use of the Service is subject to our <Box component={Link} href="/privacy" sx={{ color: GOLD, textDecoration: "none" }}>Privacy Policy</Box> and <Box component={Link} href="/data-protection" sx={{ color: GOLD, textDecoration: "none" }}>Data Protection Policy</Box>. We process order data, customer shipping addresses, and business information to deliver the Service.</P>
                    </Section>

                    <Section number="7" title="Service Availability & SLA">
                        <Li>We target 99.5% monthly uptime for the platform. Scheduled maintenance is excluded.</Li>
                        <Li>We are not liable for downtime caused by third-party services (marketplaces, carriers, payment processors).</Li>
                        <Li>We will provide advance notice of planned maintenance when possible.</Li>
                    </Section>

                    <Section number="8" title="Limitation of Liability">
                        <P>To the maximum extent permitted by law, Pythias is not liable for indirect, incidental, or consequential damages including lost profits, lost sales, or data loss. Our total liability for any claim shall not exceed the fees you paid in the 3 months preceding the claim.</P>
                    </Section>

                    <Section number="9" title="Termination">
                        <Li>You may cancel your account at any time. Cancellation takes effect at the end of your current billing period.</Li>
                        <Li>We may suspend or terminate accounts that violate these Terms, engage in fraud, or pose a risk to other users or the platform.</Li>
                        <Li>Upon termination, your data is retained for 30 days and then deleted per our Data Protection Policy.</Li>
                    </Section>

                    <Section number="10" title="Governing Law">
                        <P>These Terms are governed by the laws of the State of Michigan, USA. Disputes shall be resolved through binding arbitration in Oakland County, Michigan, except that either party may seek injunctive relief in any court of competent jurisdiction.</P>
                    </Section>

                    <Section number="11" title="Changes to Terms">
                        <P>We may update these Terms with 30 days notice via email or in-platform notification. Continued use of the Service after the effective date constitutes acceptance of the updated Terms.</P>
                    </Section>

                    <Section number="12" title="Contact">
                        <P>Questions about these Terms: <Box component={Link} href="/contact" sx={{ color: GOLD, textDecoration: "none" }}>contact us</Box> or email legal@pythiastechnologies.com.</P>
                    </Section>

                    <Divider sx={{ my: 4 }} />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem" }}>© {new Date().getFullYear()} Pythias Technologies, LLC</Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Data Protection", href: "/data-protection" }, { label: "Partner Terms", href: "/partner-terms" }].map(l => (
                                <Box key={l.href} component={Link} href={l.href} sx={{ color: GOLD, textDecoration: "none", fontSize: "0.8rem" }}>{l.label}</Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
