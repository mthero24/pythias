"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Box, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText, Container,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo_vertical.png";

const NAV_LINKS = [
  { label: "Products",      href: "/services" },
  { label: "Pricing",       href: "/pricing" },
  { label: "Pythias Connect", href: "/integrations" },
  { label: "How It Works",  href: "/how-it-works" },
  { label: "Blog",          href: "/blog" },
  { label: "About Us",      href: "/about" },
  { label: "Contact Us",    href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 0 }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: "space-between", alignItems: "center", minHeight: 72, px: { xs: 0 } }}>

          {/* Logo */}
          <Box sx={{ flexShrink: 0 }}>
            <Link href="/" style={{ display: "inline-flex" }}>
              <Image src={Logo} alt="Pythias Technologies" width={130} height={60} priority style={{ height: "auto" }} />
            </Link>
          </Box>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            {NAV_LINKS.map((link) => (
              <Button
                key={link.label}
                {...(link.href ? { component: Link, href: link.href } : { onClick: link.action })}
                sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 500, px: 2, borderRadius: 2, "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
              >
                {link.label}
              </Button>
            ))}
            <Button
              component={Link}
              href="/login"
              sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 500, px: 2, borderRadius: 2, ml: 0.5, "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" } }}
            >
              Login
            </Button>
            <Button
              component={Link}
              href="/#calendar-booking-section"
              variant="contained"
              sx={{ ml: 1.5, px: 2.5, py: 1, bgcolor: "#D3A73D", color: "#111", fontWeight: 700, "&:hover": { bgcolor: "#b8860b", boxShadow: "0 4px 16px rgba(211,167,61,0.4)" }, boxShadow: "none" }}
            >
              Book a Demo
            </Button>
          </Box>

          {/* Mobile menu icon */}
          <IconButton sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }} onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: "#0f172a", color: "#fff" } }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Image src={Logo} alt="Pythias Technologies" width={100} height={46} />
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton
                {...(link.href ? { component: Link, href: link.href } : { onClick: () => { link.action(); setMobileOpen(false); } })}
                sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/login" onClick={() => setMobileOpen(false)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
              <ListItemText primary="Login" />
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ pt: 2 }}>
            <Button
              fullWidth
              component={Link}
              href="/#calendar-booking-section"
              variant="contained"
              onClick={() => setMobileOpen(false)}
              sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, "&:hover": { bgcolor: "#b8860b" } }}
            >
              Book a Demo
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
}
