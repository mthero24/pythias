import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getPolicy } from "@/lib/policies";
import { Box, Container, Typography, Divider, Stack, Chip } from "@mui/material";
import Link from "next/link";

const GOLD = "#D3A73D";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};
  return {
    title: policy.title,
    description: policy.subtitle,
    alternates: { canonical: `https://pythiastechnologies.com/policies/${slug}` },
  };
}

const Section = ({ number, title, children }) => (
  <Box sx={{ mb: 5 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, #b88a2a)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Typography sx={{ color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>{number}</Typography>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>{title}</Typography>
    </Box>
    {children}
  </Box>
);

const P = ({ children }) => (
  <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem", mb: 1.5 }}>{children}</Typography>
);

const Li = ({ children }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 0.75 }}>
    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: GOLD, flexShrink: 0, mt: 1 }} />
    <Typography sx={{ color: "#4b5563", lineHeight: 1.8, fontSize: "0.9375rem" }}>{children}</Typography>
  </Stack>
);

const SubHeading = ({ children }) => (
  <Typography sx={{ fontWeight: 600, color: "#111827", mb: 1, mt: 2, fontSize: "0.9375rem" }}>{children}</Typography>
);

const ClassificationBadge = ({ label, description }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
    <Chip label={label} size="small" sx={{ bgcolor: GOLD, color: "#fff", fontWeight: 700, fontSize: "0.7rem", minWidth: 100, flexShrink: 0 }} />
    <Typography sx={{ color: "#4b5563", fontSize: "0.9375rem", lineHeight: 1.7 }}>{description}</Typography>
  </Box>
);

function renderItem(item, idx) {
  if (item.type === "p")              return <P key={idx}>{item.text}</P>;
  if (item.type === "li")             return <Li key={idx}>{item.text}</Li>;
  if (item.type === "sub")            return <SubHeading key={idx}>{item.text}</SubHeading>;
  if (item.type === "classification") return <ClassificationBadge key={idx} label={item.label} description={item.text} />;
  return null;
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  const session = await getServerSession(authOptions);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <Box sx={{ background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)", py: { xs: 8, md: 10 }, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, mb: 2 }}>
            Legal &amp; Compliance
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.8rem", md: "2.6rem" }, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", mb: 1 }}>
            {policy.title}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", mb: 3 }}>
            {policy.subtitle}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", mb: session ? 3 : 0 }}>
            Effective: {policy.effectiveDate} &nbsp;·&nbsp; Next review: {policy.reviewDate} &nbsp;·&nbsp; Pythias Technologies, LLC
          </Typography>
          {session && (
            <Box
              component="a"
              href={`/api/policies/pdf/${slug}`}
              download={policy.filename}
              sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, background: GOLD, color: "#0f172a", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", "&:hover": { opacity: 0.88 }, transition: "opacity 0.15s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              Download PDF
            </Box>
          )}
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, p: { xs: 3, md: 6 } }}>
          {policy.sections.map((sec, i) => (
            <Section key={sec.number} number={sec.number} title={sec.title}>
              {sec.body.map((item, j) => renderItem(item, j))}
              {i < policy.sections.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Section>
          ))}

          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ color: "#9ca3af", fontSize: "0.8rem" }}>
              © {new Date().getFullYear()} Pythias Technologies, LLC · All rights reserved
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box component={Link} href="/data-protection" sx={{ color: GOLD, textDecoration: "none", fontSize: "0.8rem", "&:hover": { textDecoration: "underline" } }}>
                Data Protection Policy
              </Box>
              <Box component={Link} href="/contact" sx={{ color: GOLD, textDecoration: "none", fontSize: "0.8rem", "&:hover": { textDecoration: "underline" } }}>
                Contact Us
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
