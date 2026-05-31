import { Box, Container, Typography, Divider, Stack } from "@mui/material";
import Link from "next/link";

export const metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for Pythias Technologies — how we collect, use, and protect your information.",
    alternates: { canonical: "https://pythiastechnologies.com/privacy" },
};

const EFFECTIVE_DATE = "May 23, 2025";

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
        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#D3A73D", flexShrink: 0, mt: 1 }} />
        <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem" }}>{children}</Typography>
    </Stack>
);

export default function PrivacyPage() {
    return (
        <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>

            {/* Header */}
            <Box sx={{
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 8, md: 10 },
                position: "relative",
                overflow: "hidden",
            }}>
                <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                <Container maxWidth="md" sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}>
                        Legal
                    </Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        Privacy Policy
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
                        Pythias Technologies, LLC (&quot;Pythias,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
                        pythiastechnologies.com and related services. This Privacy Policy explains how we collect, use, disclose, and
                        safeguard your information when you visit our website or contact us. Please read this policy carefully.
                        If you disagree with its terms, please discontinue use of the site.
                    </P>

                    <Divider sx={{ my: 4 }} />

                    <Section title="1. Information We Collect">
                        <P>We collect information you provide directly to us and information collected automatically when you use our site.</P>
                        <Typography sx={{ fontWeight: 600, color: "#111827", mb: 1, fontSize: "0.9375rem" }}>Information you provide:</Typography>
                        <Box sx={{ mb: 2 }}>
                            <Li>Name, company name, phone number, and email address submitted through our contact form or lead forms</Li>
                            <Li>Job title, order volume, and workflow information submitted through information-request forms</Li>
                            <Li>Account credentials if you register for access to our platform</Li>
                            <Li>Any messages or communications you send us</Li>
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: "#111827", mb: 1, fontSize: "0.9375rem" }}>Information collected automatically:</Typography>
                        <Box>
                            <Li>Pages visited, time on page, and navigation path on our website</Li>
                            <Li>IP address, browser type, device type, and operating system</Li>
                            <Li>Referring URLs and UTM campaign parameters</Li>
                            <Li>Session identifiers stored in browser session storage (not cookies)</Li>
                        </Box>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <P>We use the information we collect to:</P>
                        <Li>Respond to your inquiries and contact form submissions</Li>
                        <Li>Follow up on demo requests and sales leads</Li>
                        <Li>Send information about our platform, pricing, and services that you have requested</Li>
                        <Li>Analyze website traffic and user behavior to improve our site and marketing</Li>
                        <Li>Monitor and protect the security and performance of our services</Li>
                        <Li>Comply with applicable laws and legal obligations</Li>
                        <Box sx={{ mt: 1.5 }}>
                            <P>We do not use your information for automated decision-making or profiling.</P>
                        </Box>
                    </Section>

                    <Section title="3. Google Ads Lead Forms">
                        <P>
                            We use Google Ads Lead Form assets to collect contact information from users who express interest
                            in our services directly through Google search and display ads. When you submit a Google lead form,
                            Google transmits your submitted information (name, email, phone, company, and any custom responses)
                            to us via a secure webhook. This information is stored in our database and used solely to follow up
                            on your inquiry. Google&apos;s data practices are governed by the{" "}
                            <Box component="a" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                                sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                Google Privacy Policy
                            </Box>.
                        </P>
                    </Section>

                    <Section title="4. Analytics & Tracking">
                        <P>We use two analytics systems on our website:</P>
                        <Typography sx={{ fontWeight: 600, color: "#111827", mb: 0.5, fontSize: "0.9375rem" }}>Google Analytics (GA4)</Typography>
                        <P>
                            We use Google Analytics to understand aggregate traffic patterns. Google Analytics uses cookies to
                            collect data such as pages visited and session duration. This data is anonymized and aggregated.
                            You can opt out using the{" "}
                            <Box component="a" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
                                sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                Google Analytics Opt-Out Browser Add-on
                            </Box>.
                            Admin pages at /admin are excluded from Google Analytics tracking.
                        </P>
                        <Typography sx={{ fontWeight: 600, color: "#111827", mb: 0.5, fontSize: "0.9375rem" }}>Custom Session Analytics</Typography>
                        <P>
                            We operate our own analytics system that records page visits, session duration, and referral sources
                            for visitors to our public pages. This system uses a randomly generated session ID stored in your
                            browser&apos;s session storage (cleared when you close the tab). No persistent cookies are set by
                            this system. Data is stored in our own database and not shared with third parties.
                        </P>
                    </Section>

                    <Section title="5. Cookies">
                        <P>
                            Our website uses a limited number of cookies. Google Analytics sets cookies to distinguish users and
                            sessions. Our own systems use session storage rather than cookies for session tracking. We do not use
                            advertising cookies beyond those set by Google Ads for conversion tracking purposes.
                        </P>
                        <P>
                            You can control cookies through your browser settings. Disabling cookies may affect the functionality
                            of some parts of the site.
                        </P>
                    </Section>

                    <Section title="6. Sharing of Information">
                        <P>We do not sell, rent, or trade your personal information. We may share your information with:</P>
                        <Li><strong>Service providers</strong> — third-party vendors who help us operate our business (e.g., MongoDB Atlas for database hosting, Google for analytics and advertising), under confidentiality agreements</Li>
                        <Li><strong>Legal authorities</strong> — if required by law, court order, or governmental authority</Li>
                        <Li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets, with notice provided to affected users</Li>
                        <Box sx={{ mt: 1.5 }}>
                            <P>We require all third-party service providers to maintain appropriate security measures and to use your data only for the purposes we specify.</P>
                        </Box>
                    </Section>

                    <Section title="7. Data Retention">
                        <P>
                            Contact form submissions and lead form data are retained for as long as necessary to fulfill the
                            purpose for which they were collected or as required by law. Session analytics data is retained
                            for up to 24 months. You may request deletion of your data at any time by contacting us.
                        </P>
                    </Section>

                    <Section title="8. Data Security">
                        <P>
                            We implement industry-standard security measures including encrypted connections (HTTPS/TLS),
                            access controls, and secure cloud database hosting. However, no method of transmission over the
                            internet is 100% secure. We cannot guarantee absolute security but are committed to protecting
                            your information to the best of our ability.
                        </P>
                    </Section>

                    <Section title="9. Your Rights">
                        <P>Depending on your location, you may have the following rights regarding your personal information:</P>
                        <Li><strong>Access</strong> — request a copy of the personal information we hold about you</Li>
                        <Li><strong>Correction</strong> — request correction of inaccurate or incomplete information</Li>
                        <Li><strong>Deletion</strong> — request deletion of your personal information</Li>
                        <Li><strong>Opt-out</strong> — unsubscribe from marketing communications at any time</Li>
                        <Li><strong>Data portability</strong> — request your data in a structured, machine-readable format</Li>
                        <Box sx={{ mt: 1.5 }}>
                            <P>
                                To exercise any of these rights,{" "}
                                <Box component={Link} href="/contact"
                                    sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                    contact us
                                </Box>. We will respond within 30 days.
                            </P>
                        </Box>
                    </Section>

                    <Section title="10. Children's Privacy">
                        <P>
                            Our services are not directed to individuals under the age of 18. We do not knowingly collect
                            personal information from children. If you believe we have inadvertently collected such information,
                            please contact us immediately.
                        </P>
                    </Section>

                    <Section title="11. Changes to This Policy">
                        <P>
                            We may update this Privacy Policy from time to time. When we do, we will revise the effective date
                            at the top of this page. We encourage you to review this policy periodically. Continued use of our
                            website after any changes constitutes your acceptance of the updated policy.
                        </P>
                    </Section>

                    <Section title="12. Contact Us">
                        <P>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</P>
                        <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 3, p: 3, mt: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: "#111827", mb: 0.5 }}>Pythias Technologies, LLC</Typography>
                            <Typography sx={{ color: "#4b5563", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                                21440 Melrose Ave, Southfield MI 48075<br />
                                (844) 579-8442<br />
                                <Box component={Link} href="/contact"
                                    sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                    Contact Us
                                </Box>
                            </Typography>
                        </Box>
                    </Section>

                    <Divider sx={{ my: 4 }} />

                    <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem", textAlign: "center" }}>
                        © {new Date().getFullYear()} Pythias Technologies, LLC · All rights reserved ·{" "}
                        <Box component={Link} href="/contact" sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                            Contact Us
                        </Box>
                    </Typography>

                </Box>
            </Container>
        </Box>
    );
}
