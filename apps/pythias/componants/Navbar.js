"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Box, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText,
  Container, Popper, Paper, ClickAwayListener, Grow,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo_vertical.png";

const NAV_LINKS = [
  { label: "Fulfillment Cloud", href: "/fulfillment-cloud" },
  { label: "Commerce Cloud",    href: "/commerce-cloud" },
  { label: "Integrations",      href: "/integrations" },
  { label: "Contact Us",        href: "/contact" },
];

const LEARN_LINKS = [
  { label: "How It Works",  href: "/how-it-works" },
  { label: "Testimonials",  href: "/testimonials" },
  { label: "FAQ",           href: "/faq" },
  { label: "About Us",      href: "/about" },
];

const COMPARE_LINKS = [
  { label: "Pythias vs ShipStation",        href: "/compare/pythias-vs-shipstation" },
  { label: "Pythias vs Shopify",            href: "/compare/pythias-vs-shopify" },
  { label: "Pythias vs Printify",           href: "/compare/pythias-vs-printify" },
  { label: "Best DTF Fulfillment Software", href: "/compare/best-dtf-fulfillment-software" },
  { label: "Best POD Automation Software",  href: "/compare/best-print-on-demand-automation-software" },
];

const BTN_SX = { color: "rgba(255,255,255,0.65)", fontWeight: 500, px: 2, borderRadius: 2, "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" } };

function DropdownMenu({ label, links, sectionLabel, footer }) {
  const [open, setOpen]       = useState(false);
  const [anchor, setAnchor]   = useState(null);
  return (
    <>
      <Button
        onClick={(e) => { setAnchor(e.currentTarget); setOpen(true); }}
        endIcon={<ExpandMoreIcon sx={{ fontSize: "1rem !important", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />}
        sx={{ ...BTN_SX, gap: 0 }}
      >
        {label}
      </Button>
      <Popper open={open} anchorEl={anchor} placement="bottom-start" transition style={{ zIndex: 1400 }}>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={120}>
            <Paper elevation={8} sx={{ mt: 1, borderRadius: 2, overflow: "hidden", minWidth: 260, bgcolor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Box>
                  {sectionLabel && (
                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                      <Box component="span" sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D" }}>
                        {sectionLabel}
                      </Box>
                    </Box>
                  )}
                  {links.map((l) => (
                    <Box key={l.href} component={Link} href={l.href} onClick={() => setOpen(false)}
                      sx={{ display: "block", px: 2, py: 1.25, fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", fontWeight: 500, textDecoration: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#fff" }, transition: "background 0.12s, color 0.12s" }}>
                      {l.label}
                    </Box>
                  ))}
                  {footer && (
                    <>
                      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.07)", m: 1, mt: 0.5 }} />
                      <Box component={Link} href={footer.href} onClick={() => setOpen(false)}
                        sx={{ display: "block", px: 2, py: 1.25, mb: 0.5, fontSize: "0.875rem", color: "#D3A73D", fontWeight: 600, textDecoration: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
                        {footer.label}
                      </Box>
                    </>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

export default function Navbar() {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [mobileLearn,   setMobileLearn]   = useState(false);
  const [mobileCompare, setMobileCompare] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.07)", borderRadius: 0 }}>
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
              <Button key={link.label} component={Link} href={link.href} sx={BTN_SX}>
                {link.label}
              </Button>
            ))}

            <DropdownMenu
              label="Learn"
              links={LEARN_LINKS}
              sectionLabel="Resources"
            />

            <DropdownMenu
              label="Compare"
              links={COMPARE_LINKS}
              sectionLabel="Compare & Reviews"
              footer={{ label: "See Pricing →", href: "/pricing" }}
            />

            <Button component={Link} href="/login" sx={{ ...BTN_SX, ml: 0.5 }}>Login</Button>
            <Button
              component={Link} href="/pricing" variant="contained"
              sx={{ ml: 1.5, px: 2.5, py: 1, bgcolor: "#D3A73D", color: "#111", fontWeight: 700, "&:hover": { bgcolor: "#b8860b", boxShadow: "0 4px 16px rgba(211,167,61,0.4)" }, boxShadow: "none" }}
            >
              See Pricing
            </Button>
          </Box>

          {/* Mobile menu icon */}
          <IconButton sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }} onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 280, bgcolor: "#0f172a", color: "#fff" } }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Image src={Logo} alt="Pythias Technologies" width={100} height={46} />
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton component={Link} href={link.href} onClick={() => setMobileOpen(false)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Learn section */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setMobileLearn((v) => !v)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
              <ListItemText primary="Learn" />
              <ExpandMoreIcon sx={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.4)", transition: "transform 0.15s", transform: mobileLearn ? "rotate(180deg)" : "none" }} />
            </ListItemButton>
          </ListItem>
          {mobileLearn && LEARN_LINKS.map((l) => (
            <ListItem key={l.href} disablePadding>
              <ListItemButton component={Link} href={l.href} onClick={() => { setMobileOpen(false); setMobileLearn(false); }} sx={{ pl: 4, color: "rgba(255,255,255,0.55)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" } }}>
                <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: "0.85rem" }} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Compare section */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setMobileCompare((v) => !v)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
              <ListItemText primary="Compare" />
              <ExpandMoreIcon sx={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.4)", transition: "transform 0.15s", transform: mobileCompare ? "rotate(180deg)" : "none" }} />
            </ListItemButton>
          </ListItem>
          {mobileCompare && COMPARE_LINKS.map((l) => (
            <ListItem key={l.href} disablePadding>
              <ListItemButton component={Link} href={l.href} onClick={() => { setMobileOpen(false); setMobileCompare(false); }} sx={{ pl: 4, color: "rgba(255,255,255,0.55)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" } }}>
                <ListItemText primary={l.label} primaryTypographyProps={{ fontSize: "0.85rem" }} />
              </ListItemButton>
            </ListItem>
          ))}

          <ListItem disablePadding>
            <ListItemButton component={Link} href="/login" onClick={() => setMobileOpen(false)} sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
              <ListItemText primary="Login" />
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ pt: 2 }}>
            <Button fullWidth component={Link} href="/pricing" variant="contained" onClick={() => setMobileOpen(false)} sx={{ bgcolor: "#D3A73D", color: "#111", fontWeight: 700, "&:hover": { bgcolor: "#b8860b" } }}>
              See Pricing
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
}
