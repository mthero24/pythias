import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import Link from "next/link";

export const metadata = {
    title: "Fulfillment Partner Terms — Pythias Technologies",
    description: "Terms and requirements for joining the Pythias fulfillment partner network.",
    alternates: { canonical: "https://pythiastechnologies.com/partner-terms" },
};

const GOLD = "#D3A73D";
const VERSION = "1.0";
const EFFECTIVE_DATE = "June 1, 2026";
const PLATFORM_FEE_MIN = 1;
const PLATFORM_FEE_MAX = 3;

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

export default function PartnerTermsPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>
            <Box sx={{ background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)", py: { xs: 8, md: 10 }, position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}>Legal</Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        Fulfillment Partner Terms
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem" }}>
                        Version {VERSION} · Effective {EFFECTIVE_DATE} · Pythias Technologies, LLC
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>
                    <P>These Fulfillment Partner Terms ("Partner Terms") are in addition to the <Box component={Link} href="/terms" sx={{ color: GOLD, textDecoration: "none" }}>Pythias Terms of Service</Box> and govern your participation as a fulfillment provider in the Pythias network. By accepting an invitation to become a fulfillment partner, you agree to these Partner Terms.</P>
                    <Divider sx={{ my: 4 }} />

                    <Section number="1" title="Eligibility Requirements">
                        <P>To be invited as a fulfillment partner, your account must meet the following minimum criteria at the time of invitation:</P>
                        <Li>Active Pythias Fulfillment Cloud account for at least 3 months</Li>
                        <Li>Demonstrated average ship time of 4 days or fewer (order placed to tracking number generated), measured over the preceding 30 days</Li>
                        <Li>Account in good standing with no outstanding violations of the Pythias Terms of Service</Li>
                        <Li>Completed onboarding of your blank catalog with accurate wholesale pricing</Li>
                        <P>Meeting these criteria does not guarantee an invitation — Pythias reserves the right to invite partners based on network capacity, geographic need, and quality standards.</P>
                    </Section>

                    <Section number="2" title="Partner Obligations">
                        <Li>Fulfill all accepted orders within your stated lead time. Consistent failure to meet lead times may result in removal from the network.</Li>
                        <Li>Maintain accurate inventory counts. Accepting orders for items you cannot fulfill is a material breach of these terms.</Li>
                        <Li>Package and ship orders as if they came from your own storefront — blind fulfillment. Do not include your own marketing materials unless agreed with the originating seller.</Li>
                        <Li>Upload valid tracking numbers within 24 hours of shipment.</Li>
                        <Li>Respond to quality disputes within 48 hours.</Li>
                        <Li>Maintain your blank catalog pricing. Price changes take effect on future orders only — in-progress orders are fulfilled at the price at time of routing.</Li>
                    </Section>

                    <Section number="3" title="Platform Fee">
                        <P>Pythias charges a platform fee of {PLATFORM_FEE_MIN}–{PLATFORM_FEE_MAX}% of the wholesale order value on each order routed to you through the network. Your specific fee rate is set at the time of your partner invitation and shown in your account settings.</P>
                        <Li>The platform fee is deducted from your payout automatically — you receive the wholesale price minus the fee.</Li>
                        <Li>The platform fee compensates Pythias for routing infrastructure, payment processing, dispute resolution, and network maintenance.</Li>
                        <Li>Pythias may adjust your fee rate with 30 days notice. You may terminate your partner status if you do not agree to a fee change.</Li>
                    </Section>

                    <Section number="4" title="Payouts">
                        <Li>Payouts are processed weekly via ACH or Stripe Connect transfer.</Li>
                        <Li>Payouts are held for 7 days after order shipment to allow for dispute windows.</Li>
                        <Li>Orders subject to active disputes have their payout held pending resolution.</Li>
                        <Li>Pythias reserves the right to hold payouts for accounts under investigation for quality or compliance issues.</Li>
                    </Section>

                    <Section number="5" title="Quality Standards">
                        <P>Partners are expected to maintain a defect rate below 2% (replacements + refunds as a percentage of fulfilled orders) on a rolling 30-day basis. Partners consistently above this threshold will be placed in a performance review period and may be removed from the network.</P>
                    </Section>

                    <Section number="6" title="Order Acceptance">
                        <Li>Orders routed to you must be accepted or declined within 2 hours. Unresponded orders auto-accept if you have auto-accept enabled.</Li>
                        <Li>Declining more than 15% of routed orders in a 30-day period may result in reduced routing volume.</Li>
                        <Li>You may pause order intake at any time via your partner dashboard — paused accounts are excluded from routing until resumed.</Li>
                    </Section>

                    <Section number="7" title="Intellectual Property & Confidentiality">
                        <Li>Designs and product content routed to you remain the property of the originating seller. You may not reproduce, sell, or use them outside of fulfilling the specific order.</Li>
                        <Li>You may not contact end customers directly or use their data for any purpose other than fulfilling the routed order.</Li>
                        <Li>Order routing data, pricing, and network information are confidential and may not be shared outside your organization.</Li>
                    </Section>

                    <Section number="8" title="Non-Circumvention">
                        <P>You may not use the Pythias network to identify sellers and then solicit them to route orders outside of the platform. Violation of this clause is grounds for immediate removal from the network and may result in legal action.</P>
                    </Section>

                    <Section number="9" title="Termination">
                        <Li>You may leave the partner network at any time with 30 days notice. In-progress orders must be fulfilled before your exit date.</Li>
                        <Li>Pythias may remove a partner immediately for material breach, consistent quality failures, fraud, or non-circumvention violations.</Li>
                        <Li>Removal from the partner network does not affect your underlying Fulfillment Cloud subscription.</Li>
                    </Section>

                    <Section number="10" title="Governing Law">
                        <P>These Partner Terms are governed by the laws of the State of Michigan. Disputes shall be resolved per the arbitration clause in the Pythias Terms of Service.</P>
                    </Section>

                    <Divider sx={{ my: 4 }} />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem" }}>© {new Date().getFullYear()} Pythias Technologies, LLC</Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            {[{ label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }, { label: "Data Protection", href: "/data-protection" }].map(l => (
                                <Box key={l.href} component={Link} href={l.href} sx={{ color: GOLD, textDecoration: "none", fontSize: "0.8rem" }}>{l.label}</Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
