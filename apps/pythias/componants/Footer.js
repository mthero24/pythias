"use client";
import { usePathname } from "next/navigation";
import { Box, Container, Typography, Stack, Divider } from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo_vertical.png";

const LINKS = [
    { label: "Services",      href: "/services" },
    { label: "Features",      href: "/features" },
    { label: "Integrations",  href: "/integrations" },
    { label: "How It Works",  href: "/how-it-works" },
    { label: "Blog",          href: "/blog" },
    { label: "Tutorials",     href: "/tutorials" },
    { label: "About Us",      href: "/about" },
    { label: "About Pythias", href: "/about-pythias-technologies" },
    { label: "Contact Us",    href: "/contact" },
    { label: "Privacy Policy",  href: "/privacy" },
    { label: "Data Protection", href: "/data-protection" },
    { label: "Security Policies", href: "/policies/security-baseline" },
    { label: "Sitemap",         href: "/sitemap.xml" },
];

export default function Footer() {
    const pathname = usePathname();
    if (pathname?.startsWith("/admin")) return null;

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "#0f172a",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                py: { xs: 6, md: 8 },
            }}
        >
            <Container maxWidth="xl">
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={4}
                    sx={{ mb: 5 }}
                >
                    {/* Brand */}
                    <Box>
                        <Link href="/" style={{ display: "inline-flex" }}>
                            <Image src={Logo} alt="Pythias Technologies" width={110} height={50} style={{ height: "auto" }} />
                        </Link>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", mt: 1.5, maxWidth: 280, lineHeight: 1.7 }}>
                            All-in-one print-on-demand automation platform for custom apparel businesses.
                        </Typography>
                        {/* Veteran-owned badge — veterans helping veterans build self-sufficient businesses. */}
                        <Box
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 1, mt: 2,
                                px: 1.5, py: 0.75, borderRadius: 999,
                                border: "1px solid rgba(211,167,61,0.5)", bgcolor: "rgba(211,167,61,0.10)",
                            }}
                            title="Pythias Technologies is a veteran-owned and operated business."
                        >
                            <Box component="span" aria-hidden sx={{ fontSize: "0.95rem", lineHeight: 1 }}>🎖️</Box>
                            <Typography sx={{ color: "#E4C77A", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                Veteran-Owned &amp; Operated
                            </Typography>
                        </Box>
                    </Box>

                    {/* Nav links */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, md: 2 } }}>
                        {LINKS.map((l) => (
                            <Box
                                key={l.href}
                                component={Link}
                                href={l.href}
                                sx={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "0.875rem",
                                    textDecoration: "none",
                                    "&:hover": { color: "#D3A73D" },
                                    transition: "color 0.15s",
                                }}
                            >
                                {l.label}
                            </Box>
                        ))}
                    </Box>
                </Stack>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 4 }} />

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                    <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>
                        © {new Date().getFullYear()} Pythias Technologies, LLC · All rights reserved.
                    </Typography>
                    <Stack direction="row" spacing={3}>
                        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>
                            1421 Hidden View Drive, Lapeer MI 48446
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>
                            (844) 579-8442
                        </Typography>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}
