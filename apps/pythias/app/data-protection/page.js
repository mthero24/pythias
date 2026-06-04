import { Box, Container, Typography, Divider, Stack, Chip } from "@mui/material";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const metadata = {
    title: "Data Protection Policy",
    description: "Pythias Technologies internal data protection policy — how we classify, handle, and safeguard personal and business data across our platform and operations.",
    alternates: { canonical: "https://pythiastechnologies.com/data-protection" },
};

const GOLD = "#D3A73D";
const EFFECTIVE_DATE = "May 26, 2026";
const REVIEW_DATE = "May 26, 2027";

const Section = ({ number, title, children }) => (
    <Box sx={{ mb: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box sx={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #D3A73D, #b88a2a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                <Typography sx={{ color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>{number}</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                {title}
            </Typography>
        </Box>
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

const SubHeading = ({ children }) => (
    <Typography sx={{ fontWeight: 600, color: "#111827", mb: 1, mt: 2, fontSize: "0.9375rem" }}>
        {children}
    </Typography>
);

const ClassificationBadge = ({ label, color, description }) => (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
        <Chip label={label} size="small" sx={{ bgcolor: color, color: "#fff", fontWeight: 700, fontSize: "0.7rem", minWidth: 90, flexShrink: 0 }} />
        <Typography sx={{ color: "#4b5563", fontSize: "0.9375rem", lineHeight: 1.7 }}>{description}</Typography>
    </Box>
);

export default async function DataProtectionPage() {
    const session = await getServerSession(authOptions);
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
                        Legal &amp; Compliance
                    </Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1.5 }}>
                        Data Protection Policy
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", mb: 3 }}>
                        Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; Next review: {REVIEW_DATE} &nbsp;·&nbsp; Pythias Technologies, LLC
                    </Typography>
                    {session && (
                        <Box
                            component="a"
                            href="/api/data-protection/pdf"
                            download="pythias-data-protection-policy.pdf"
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 1,
                                px: 2.5, py: 1.2,
                                background: GOLD,
                                color: "#0f172a",
                                borderRadius: "8px",
                                fontWeight: 700, fontSize: "0.875rem",
                                textDecoration: "none",
                                "&:hover": { opacity: 0.88 },
                                transition: "opacity 0.15s",
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            Download PDF
                        </Box>
                    )}
                </Container>
            </Box>

            {/* Body */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>

                    {/* Intro */}
                    <P>
                        Pythias Technologies, LLC (&quot;Pythias,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the
                        personal and business data of our clients, their customers, our employees, and our vendors. This Data
                        Protection Policy establishes the principles, standards, and responsibilities that govern how data is
                        collected, stored, accessed, transmitted, retained, and disposed of across all Pythias systems and operations.
                    </P>
                    <P>
                        This policy applies to all Pythias employees, contractors, and service accounts that access any system
                        or data controlled by Pythias. It is reviewed and updated at least annually, or whenever a material
                        change in operations or applicable law requires it.
                    </P>

                    <Divider sx={{ my: 4 }} />

                    <Section number="1" title="Scope">
                        <P>This policy covers all personal and business-sensitive data processed by Pythias, including but not limited to:</P>
                        <Li>Client account information (company name, contact details, billing information)</Li>
                        <Li>End-customer order data ingested from marketplace integrations (ShipStation, TikTok, Etsy, Kohl&apos;s, Walmart, Shopify)</Li>
                        <Li>End-customer shipping addresses and fulfillment records</Li>
                        <Li>Employee and contractor credentials, contact information, and access logs</Li>
                        <Li>API keys, OAuth tokens, and integration credentials stored in environment configuration</Li>
                        <Li>Design files, product images, and production assets uploaded by or on behalf of clients</Li>
                        <Li>Analytics and behavioral data collected from website visitors</Li>
                    </Section>

                    <Section number="2" title="Data Classification">
                        <P>All data handled by Pythias is assigned one of the following classification levels, which determines acceptable storage, access, and transmission controls:</P>
                        <ClassificationBadge label="Restricted" color="#dc2626" description="Credentials, API keys, OAuth tokens, passwords (hashed), encryption keys, and payment-adjacent data. Must never be logged, transmitted in plaintext, or stored outside of secured environment configuration (.env files outside version control or a secrets manager)." />
                        <ClassificationBadge label="Confidential" color="#d97706" description="End-customer PII (name, address, email, phone) from order data; client billing details; internal financial records. Accessible only to employees with a documented business need. Must be encrypted at rest and in transit." />
                        <ClassificationBadge label="Internal" color="#2563eb" description="Client account information, production analytics, design assets, and operational data. Accessible to Pythias employees and the client who owns the data. Not to be shared externally without authorization." />
                        <ClassificationBadge label="Public" color="#16a34a" description="Marketing content, published blog posts, pricing pages, and other information intentionally made available on pythiastechnologies.com." />
                    </Section>

                    <Section number="3" title="Data Collection Principles">
                        <P>Pythias collects only the data necessary to deliver its services. We apply the following principles:</P>
                        <Li><strong>Purpose limitation</strong> — data is collected for a specific, explicit, and legitimate purpose and not processed in a manner incompatible with that purpose.</Li>
                        <Li><strong>Data minimization</strong> — we collect only what is necessary for the stated purpose; we do not retain fields we do not use.</Li>
                        <Li><strong>Accuracy</strong> — we take reasonable steps to keep data accurate and, where inaccurate, to correct or delete it promptly.</Li>
                        <Li><strong>Transparency</strong> — clients and website visitors are informed of what data is collected and why through our Privacy Policy at /privacy.</Li>
                    </Section>

                    <Section number="4" title="Access Controls">
                        <SubHeading>Role-based access</SubHeading>
                        <P>
                            All Pythias platform accounts are assigned a role (administrator, production, viewer) that determines
                            what data and functionality they can access. Access is granted on a least-privilege basis — users
                            receive only the permissions required for their job function. Administrator access is restricted to
                            named individuals and reviewed quarterly.
                        </P>
                        <SubHeading>Credential management</SubHeading>
                        <Li>All user passwords are hashed with bcrypt (minimum cost factor 12) and never stored in plaintext.</Li>
                        <Li>API keys and OAuth tokens are stored in environment variables, never hardcoded in source code.</Li>
                        <Li>Environment configuration files (.env, .env.local) are excluded from version control via .gitignore and are never committed to any repository.</Li>
                        <Li>Integration credentials (e.g., marketplace API keys) are stored per-environment and rotated at least annually, or immediately upon suspected compromise.</Li>
                        <SubHeading>Employee offboarding</SubHeading>
                        <P>
                            When an employee or contractor leaves, their platform accounts are disabled within one business day of
                            departure. Any shared credentials they had access to are rotated within five business days.
                        </P>
                    </Section>

                    <Section number="5" title="Data Storage &amp; Infrastructure">
                        <Li><strong>Database</strong> — all production data is stored in MongoDB Atlas (cloud-hosted, AWS us-east-1). Atlas enforces encryption at rest (AES-256) and in transit (TLS 1.2+). Database access is restricted by IP allowlist to Pythias server IPs.</Li>
                        <Li><strong>File storage</strong> — production assets and images are stored in Wasabi S3-compatible object storage. Buckets are configured for server-side encryption. Public-read ACLs are applied only to assets intended for public display.</Li>
                        <Li><strong>Application servers</strong> — applications run on PM2-managed Node.js clusters. Server access is restricted to authorized personnel via SSH key authentication only.</Li>
                        <Li><strong>Backups</strong> — MongoDB Atlas automated backups are retained for 7 days. Application code is version-controlled in a private Git repository.</Li>
                        <Li><strong>Logging</strong> — application logs are stored locally and rotated. Logs must not contain passwords, API keys, or full PII fields (e.g., full credit card numbers). Shipping addresses in logs are acceptable for order tracing purposes.</Li>
                    </Section>

                    <Section number="6" title="Data Transmission">
                        <Li>All data transmitted between clients and Pythias services uses HTTPS (TLS 1.2 or higher). HTTP is redirected to HTTPS on all endpoints.</Li>
                        <Li>Inter-service communication within the Pythias platform uses authenticated API calls with token-based authorization.</Li>
                        <Li>Webhook payloads from third parties (e.g., Google Lead Forms, marketplace order hooks) are validated using shared secrets or signature verification before processing.</Li>
                        <Li>Data is never transmitted to third parties outside of documented integrations without written authorization.</Li>
                    </Section>

                    <Section number="7" title="Third-Party Service Providers">
                        <P>Pythias uses the following categories of third-party processors. All are governed by their own data processing agreements and privacy policies:</P>
                        <Li><strong>MongoDB Atlas</strong> (database hosting) — SOC 2 Type II certified, GDPR-compliant</Li>
                        <Li><strong>Wasabi Technologies</strong> (object storage) — S3-compatible, encrypted at rest</Li>
                        <Li><strong>ShipStation</strong> (shipping integration) — order data shared to generate shipping labels</Li>
                        <Li><strong>Marketplace APIs</strong> (TikTok Shop, Etsy, Kohl&apos;s, Walmart, Shopify, Acenda) — order and listing data exchanged per each platform&apos;s developer agreement</Li>
                        <Li><strong>Google</strong> (Analytics GA4, Ads lead forms) — governed by Google&apos;s data processing terms</Li>
                        <Li><strong>OpenAI</strong> (AI text and image generation) — prompts may include design names and product descriptions; no PII is intentionally included in prompts</Li>
                        <P>We do not authorize sub-processors to use client data for their own purposes beyond providing the contracted service.</P>
                    </Section>

                    <Section number="8" title="Data Retention &amp; Deletion">
                        <Li><strong>Order data</strong> — retained for 3 years to support fulfillment disputes, chargebacks, and marketplace audits, then deleted.</Li>
                        <Li><strong>Client account data</strong> — retained for the duration of the client relationship plus 1 year after termination, then deleted upon written request or automatically.</Li>
                        <Li><strong>Website analytics</strong> — session analytics retained for 24 months; Google Analytics data is governed by GA4&apos;s retention settings (configured to 14 months).</Li>
                        <Li><strong>Contact form and lead data</strong> — retained until the inquiry is resolved or the contact opts out, with a maximum of 2 years.</Li>
                        <Li><strong>Application logs</strong> — rotated on a rolling 30-day basis unless an active incident requires longer retention.</Li>
                        <Li><strong>Terminated employee accounts</strong> — disabled immediately; personal data removed within 30 days of departure.</Li>
                        <P>Data deletion requests from clients or their end-customers are processed within 30 days of a written request submitted via our <Box component={Link} href="/contact" sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>contact page</Box>.</P>
                    </Section>

                    <Section number="9" title="Incident Response &amp; Breach Notification">
                        <SubHeading>What constitutes an incident</SubHeading>
                        <P>
                            A data protection incident includes any confirmed or suspected unauthorized access, disclosure,
                            alteration, or destruction of Restricted or Confidential data — including lost or stolen devices
                            with access to Pythias systems, compromised credentials, or unintended data exposure.
                        </P>
                        <SubHeading>Response steps</SubHeading>
                        <Li><strong>Contain</strong> — immediately revoke affected credentials, restrict access, or take the affected service offline if necessary.</Li>
                        <Li><strong>Assess</strong> — determine the scope and nature of data affected within 24 hours.</Li>
                        <Li><strong>Notify</strong> — inform affected clients within 72 hours of confirmed breach. If end-customer PII was exposed, clients are provided with sufficient detail to fulfill their own notification obligations.</Li>
                        <Li><strong>Remediate</strong> — address root cause, implement additional controls, and document the incident and resolution.</Li>
                        <Li><strong>Review</strong> — conduct a post-incident review within 14 days to update controls and prevent recurrence.</Li>
                        <SubHeading>Reporting</SubHeading>
                        <P>
                            Any employee or contractor who discovers or suspects a data incident must report it immediately to the
                            company owner. Do not attempt to investigate alone or delay reporting to avoid embarrassment — early
                            reporting minimizes harm.
                        </P>
                    </Section>

                    <Section number="10" title="Employee Responsibilities">
                        <P>Every person with access to Pythias systems is responsible for:</P>
                        <Li>Using only their own credentials to access systems — never sharing passwords or API keys with others.</Li>
                        <Li>Locking or logging out of systems when stepping away from a workstation.</Li>
                        <Li>Reporting suspected phishing, malware, or unauthorized access attempts immediately.</Li>
                        <Li>Not downloading or copying Confidential or Restricted data to personal devices or unauthorized cloud services.</Li>
                        <Li>Following this policy and asking when uncertain — &quot;I wasn&apos;t sure&quot; is not a defense for a preventable breach.</Li>
                        <P>
                            Violations of this policy may result in access revocation, termination of contract or employment,
                            and referral to appropriate legal authorities.
                        </P>
                    </Section>

                    <Section number="11" title="Policy Review &amp; Updates">
                        <P>
                            This policy is reviewed at least annually (next review: {REVIEW_DATE}) and updated whenever:
                        </P>
                        <Li>A new data category or integration is added that materially changes our data handling</Li>
                        <Li>A significant security incident occurs</Li>
                        <Li>Applicable law or a client contract requires changes</Li>
                        <Li>The company undergoes a material operational change</Li>
                        <P>
                            The current version of this policy is always available at pythiastechnologies.com/data-protection.
                            Employees and contractors are notified of material changes via email.
                        </P>
                    </Section>

                    <Section number="12" title="Contact &amp; Questions">
                        <P>
                            Questions about this policy, data handling practices, or to submit a data deletion or access request,
                            contact us at:
                        </P>
                        <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 3, p: 3, mt: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: "#111827", mb: 0.5 }}>Pythias Technologies, LLC</Typography>
                            <Typography sx={{ color: "#4b5563", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                                1421 Hidden View Drive, Lapeer MI 48446<br />
                                (844) 579-8442<br />
                                <Box component={Link} href="/contact"
                                    sx={{ color: "#D3A73D", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                                    Contact Us
                                </Box>
                            </Typography>
                        </Box>
                    </Section>

                    <Divider sx={{ my: 4 }} />

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                            © {new Date().getFullYear()} Pythias Technologies, LLC · All rights reserved
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Box component={Link} href="/privacy" sx={{ color: "#D3A73D", textDecoration: "none", fontSize: "0.8rem", "&:hover": { textDecoration: "underline" } }}>
                                Privacy Policy
                            </Box>
                            <Box component={Link} href="/contact" sx={{ color: "#D3A73D", textDecoration: "none", fontSize: "0.8rem", "&:hover": { textDecoration: "underline" } }}>
                                Contact Us
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Container>
        </Box>
    );
}
