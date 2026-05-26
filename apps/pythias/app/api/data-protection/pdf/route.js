import { NextResponse } from "next/server";
import { buildPolicyPdf } from "@/lib/policyPdf";

const DATA_PROTECTION = {
  slug: "data-protection",
  title: "Data Protection Policy",
  subtitle: "How We Collect, Handle, and Safeguard Personal and Business Data",
  filename: "pythias-data-protection-policy.pdf",
  effectiveDate: "May 26, 2026",
  reviewDate: "May 26, 2027",
  sections: [
    {
      number: "1", title: "Scope",
      body: [
        { type: "p", text: "This policy covers all personal and business-sensitive data processed by Pythias, including but not limited to:" },
        { type: "li", text: "Client account information (company name, contact details, billing information)" },
        { type: "li", text: "End-customer order data ingested from marketplace integrations (ShipStation, TikTok, Etsy, Kohl's, Walmart, Shopify)" },
        { type: "li", text: "End-customer shipping addresses and fulfillment records" },
        { type: "li", text: "Employee and contractor credentials, contact information, and access logs" },
        { type: "li", text: "API keys, OAuth tokens, and integration credentials stored in environment configuration" },
        { type: "li", text: "Design files, product images, and production assets uploaded by or on behalf of clients" },
        { type: "li", text: "Analytics and behavioral data collected from website visitors" },
      ],
    },
    {
      number: "2", title: "Data Classification",
      body: [
        { type: "p", text: "All data handled by Pythias is assigned one of the following classification levels:" },
        { type: "classification", label: "RESTRICTED", text: "Credentials, API keys, OAuth tokens, passwords (hashed), encryption keys, and payment-adjacent data. Must never be logged, transmitted in plaintext, or stored outside secured environment configuration." },
        { type: "classification", label: "CONFIDENTIAL", text: "End-customer PII (name, address, email, phone) from order data; client billing details; internal financial records. Accessible only to employees with a documented business need." },
        { type: "classification", label: "INTERNAL", text: "Client account information, production analytics, design assets, and operational data. Accessible to Pythias employees and the client who owns the data." },
        { type: "classification", label: "PUBLIC", text: "Marketing content, published blog posts, pricing pages, and other information intentionally made available on pythiastechnologies.com." },
      ],
    },
    {
      number: "3", title: "Data Collection Principles",
      body: [
        { type: "p", text: "Pythias collects only the data necessary to deliver its services. We apply the following principles:" },
        { type: "li", text: "Purpose limitation — data is collected for a specific, explicit, and legitimate purpose and not processed in a manner incompatible with that purpose." },
        { type: "li", text: "Data minimization — we collect only what is necessary for the stated purpose; we do not retain fields we do not use." },
        { type: "li", text: "Accuracy — we take reasonable steps to keep data accurate and, where inaccurate, to correct or delete it promptly." },
        { type: "li", text: "Transparency — clients and website visitors are informed of what data is collected and why through our Privacy Policy at /privacy." },
      ],
    },
    {
      number: "4", title: "Access Controls",
      body: [
        { type: "sub", text: "Role-based access" },
        { type: "p", text: "All Pythias platform accounts are assigned a role (administrator, production, viewer) that determines what data and functionality they can access. Access is granted on a least-privilege basis. Administrator access is restricted to named individuals and reviewed quarterly." },
        { type: "sub", text: "Credential management" },
        { type: "li", text: "All user passwords are hashed with bcrypt (minimum cost factor 12) and never stored in plaintext." },
        { type: "li", text: "API keys and OAuth tokens are stored in environment variables, never hardcoded in source code." },
        { type: "li", text: "Environment configuration files (.env, .env.local) are excluded from version control via .gitignore." },
        { type: "li", text: "Integration credentials are stored per-environment and rotated at least annually, or immediately upon suspected compromise." },
        { type: "sub", text: "Employee offboarding" },
        { type: "p", text: "When an employee or contractor leaves, their platform accounts are disabled within one business day. Any shared credentials they had access to are rotated within five business days." },
      ],
    },
    {
      number: "5", title: "Data Storage & Infrastructure",
      body: [
        { type: "li", text: "Database — MongoDB Atlas (AWS us-east-1), AES-256 encryption at rest, TLS 1.2+ in transit, IP allowlist restricted." },
        { type: "li", text: "File storage — Wasabi S3-compatible object storage with server-side encryption. Public-read ACLs applied only to assets intended for public display." },
        { type: "li", text: "Application servers — PM2-managed Node.js clusters; SSH key authentication only." },
        { type: "li", text: "Backups — MongoDB Atlas automated backups retained for 7 days." },
        { type: "li", text: "Logging — logs rotated regularly; must not contain passwords, API keys, or full PII fields." },
      ],
    },
    {
      number: "6", title: "Data Transmission",
      body: [
        { type: "li", text: "All data transmitted between clients and Pythias services uses HTTPS (TLS 1.2 or higher). HTTP is redirected to HTTPS on all endpoints." },
        { type: "li", text: "Inter-service communication uses authenticated API calls with token-based authorization." },
        { type: "li", text: "Webhook payloads from third parties are validated using shared secrets or signature verification before processing." },
        { type: "li", text: "Data is never transmitted to third parties outside of documented integrations without written authorization." },
      ],
    },
    {
      number: "7", title: "Third-Party Service Providers",
      body: [
        { type: "p", text: "Pythias uses the following categories of third-party processors, all governed by their own data processing agreements:" },
        { type: "li", text: "MongoDB Atlas — database hosting, SOC 2 Type II certified, GDPR-compliant" },
        { type: "li", text: "Wasabi Technologies — S3-compatible object storage, encrypted at rest" },
        { type: "li", text: "ShipStation — order data shared to generate shipping labels" },
        { type: "li", text: "Marketplace APIs — TikTok Shop, Etsy, Kohl's, Walmart, Shopify, Acenda" },
        { type: "li", text: "Google — Analytics GA4 and Ads lead forms" },
        { type: "li", text: "OpenAI — AI text and image generation; no PII is intentionally included in prompts" },
        { type: "p", text: "We do not authorize sub-processors to use client data for their own purposes beyond providing the contracted service." },
      ],
    },
    {
      number: "8", title: "Data Retention & Deletion",
      body: [
        { type: "li", text: "Order data — retained for 3 years to support fulfillment disputes and marketplace audits, then deleted." },
        { type: "li", text: "Client account data — retained for the duration of the client relationship plus 1 year after termination." },
        { type: "li", text: "Website analytics — session analytics retained for 24 months; GA4 configured to 14-month retention." },
        { type: "li", text: "Contact form and lead data — maximum of 2 years, or until the inquiry is resolved." },
        { type: "li", text: "Application logs — rotated on a rolling 30-day basis." },
        { type: "li", text: "Terminated employee accounts — disabled immediately; personal data removed within 30 days of departure." },
        { type: "p", text: "Data deletion requests are processed within 30 days of written request to info@pythiastechnologies.com." },
      ],
    },
    {
      number: "9", title: "Incident Response & Breach Notification",
      body: [
        { type: "sub", text: "What constitutes an incident" },
        { type: "p", text: "A data protection incident includes any confirmed or suspected unauthorized access, disclosure, alteration, or destruction of Restricted or Confidential data." },
        { type: "sub", text: "Response steps" },
        { type: "li", text: "Contain — immediately revoke affected credentials, restrict access, or take the affected service offline if necessary." },
        { type: "li", text: "Assess — determine scope and nature of data affected within 24 hours." },
        { type: "li", text: "Notify — inform affected clients within 72 hours of confirmed breach." },
        { type: "li", text: "Remediate — address root cause, implement additional controls, and document the incident." },
        { type: "li", text: "Review — conduct a post-incident review within 14 days." },
      ],
    },
    {
      number: "10", title: "Employee Responsibilities",
      body: [
        { type: "li", text: "Using only their own credentials — never sharing passwords or API keys with others." },
        { type: "li", text: "Reporting suspected phishing, malware, or unauthorized access attempts immediately." },
        { type: "li", text: "Not downloading Confidential or Restricted data to personal devices or unauthorized cloud services." },
        { type: "p", text: "Violations may result in access revocation, termination of contract or employment, and referral to appropriate legal authorities." },
      ],
    },
    {
      number: "11", title: "Policy Review & Updates",
      body: [
        { type: "p", text: "This policy is reviewed at least annually (next review: May 26, 2027). The current version is always available at pythiastechnologies.com/data-protection." },
      ],
    },
    {
      number: "12", title: "Contact & Questions",
      body: [
        { type: "p", text: "Pythias Technologies, LLC\n21440 Melrose Ave, Southfield MI 48075\n(844) 579-8442\ninfo@pythiastechnologies.com" },
      ],
    },
  ],
};

export async function GET() {
  try {
    const pdf = await buildPolicyPdf(DATA_PROTECTION);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": 'attachment; filename="pythias-data-protection-policy.pdf"',
        "Content-Length":      String(pdf.length),
      },
    });
  } catch (e) {
    console.error("PDF error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
