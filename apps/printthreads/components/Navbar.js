"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import {
  Avatar,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useCSV } from "@pythias/backend";
import * as logo from "../public/log.png";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import PaletteIcon from "@mui/icons-material/Palette";
import EditIcon from "@mui/icons-material/Edit";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import BrushIcon from "@mui/icons-material/Brush";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import HubIcon from "@mui/icons-material/Hub";
import QrCodeIcon from "@mui/icons-material/QrCode";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PrintIcon from "@mui/icons-material/Print";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SearchIcon from "@mui/icons-material/Search";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FolderIcon from "@mui/icons-material/Folder";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const DRAWER_WIDTH = 260;

const SIDEBAR_BG   = "#1a2332";
const SIDEBAR_TEXT = "#e2e8f0";
const SIDEBAR_MUTED = "#94a3b8";
const SIDEBAR_HOVER = "rgba(255,255,255,0.07)";
const SIDEBAR_ACTIVE = "rgba(255,255,255,0.12)";

const NAV_SECTIONS = [
  {
    label: "Manage",
    items: [
      { label: "Dashboard",    href: "/admin",             icon: <DashboardIcon fontSize="small" /> },
      { label: "Users",        href: "/admin/users",       icon: <PeopleIcon fontSize="small" /> },
      { label: "Licenses",     href: "/admin/license",     icon: <BadgeIcon fontSize="small" /> },
      { label: "Colors",       href: "/admin/colors",      icon: <PaletteIcon fontSize="small" /> },
      { label: "Edit Data",    href: "/admin/edit-data",   icon: <EditIcon fontSize="small" /> },
      { label: "Pricing",      href: "/admin/pricing",     icon: <AttachMoneyIcon fontSize="small" /> },
      { label: "Blanks",       href: "/admin/blanks",      icon: <CheckroomIcon fontSize="small" /> },
      { label: "Designs",      href: "/admin/designs",     icon: <BrushIcon fontSize="small" /> },
      { label: "Products",     href: "/admin/products",    icon: <Inventory2Icon fontSize="small" />, csv: true },
      { label: "Integrations", href: "/admin/integrations",icon: <HubIcon fontSize="small" />, csv: true },
      { label: "Sales",        href: "/admin/sales",        icon: <LocalOfferIcon fontSize="small" /> },
      { label: "Fix UPC",      href: "/admin/fix-upc",      icon: <QrCodeIcon fontSize="small" /> },
    ],
  },
  {
    label: "Orders & Production",
    items: [
      { label: "Orders",       href: "/orders",                    icon: <ListAltIcon fontSize="small" /> },
      { label: "Print Labels", href: "/production/print-labels",   icon: <PrintIcon fontSize="small" /> },
      { label: "Load DTF",     href: "/production/dtf-send",       icon: <FileUploadIcon fontSize="small" /> },
      { label: "Find DTF",     href: "/production/dtf-find",       icon: <SearchIcon fontSize="small" /> },
      { label: "Embroidery",   href: "/production/embroidery",     icon: <AutoFixHighIcon fontSize="small" /> },
      { label: "Folder",       href: "/production/roq-folder",     icon: <FolderIcon fontSize="small" /> },
      { label: "Ship Orders",      href: "/production/shipping",       icon: <LocalShippingIcon fontSize="small" /> },
      { label: "Track Shipping",   href: "/production/shipping-labels", icon: <TrackChangesIcon fontSize="small" /> },
      { label: "Track Production", href: "/production/track-labels",    icon: <TimelineIcon fontSize="small" /> },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Inventory", href: "/inventory",          icon: <WarehouseIcon fontSize="small" /> },
      { label: "Returns",   href: "/production/returns", icon: <AssignmentReturnIcon fontSize="small" /> },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Setup Guides", href: "https://pythiastechnologies.com/setup-guides/integrations", icon: <MenuBookIcon fontSize="small" />, target: "_blank" },
    ],
  },
];

export default function ButtonAppBar() {
  const [open, setOpen]     = useState(false);
  const [avatar, setAvatar] = useState(null);
  const { data: session }   = useSession();

  useEffect(() => {
    if (!session?.user) return;
    axios.get("/api/account").then(res => {
      if (!res.data.error && res.data.user?.avatar) setAvatar(res.data.user.avatar);
    }).catch(() => {});
  }, [session?.user?.userName]);

  const initials  = session?.user
    ? ((session.user.firstName?.[0] ?? "") + (session.user.lastName?.[0] ?? "")).toUpperCase() || session.user.userName?.[0]?.toUpperCase() || "?"
    : "?";
  const avatarSx  = avatar?.startsWith("#") ? { bgcolor: avatar } : {};
  const avatarSrc = avatar?.startsWith("http") ? avatar : undefined;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          color: "#1a2332",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          <IconButton
            edge="start"
            aria-label="open menu"
            onClick={() => setOpen(true)}
            sx={{ mr: 1.5, color: "#1a2332" }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <Image alt="logo" src={logo} width={110} height={40} style={{ objectFit: "contain" }} />
            </Link>
          </Box>

          <Tooltip title="My account">
            <IconButton component={Link} href="/account" size="small" sx={{ mr: 1, p: 0.25 }}>
              <Avatar src={avatarSrc} sx={{ width: 30, height: 30, fontSize: "0.72rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}>
                {!avatarSrc && initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Tooltip title="Sign out">
            <IconButton
              size="small"
              onClick={() => signOut({ callbackUrl: "/" })}
              sx={{ color: "text.secondary", border: "1px solid", borderColor: "rgba(0,0,0,0.12)", borderRadius: 1.5, px: 1.25, py: 0.6, gap: 0.75, "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.2)" } }}
            >
              <LogoutIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Sign out</Typography>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <NavDrawer open={open} onClose={() => setOpen(false)} avatarSrc={avatarSrc} avatarSx={avatarSx} initials={initials} />
    </>
  );
}

function NavDrawer({ open, onClose, avatarSrc, avatarSx = {}, initials = "?" }) {
  const { setShow } = useCSV();
  const { data: session } = useSession();

  const handleNav = (csv = false) => {
    setShow(csv);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          backgroundColor: SIDEBAR_BG,
          color: SIDEBAR_TEXT,
          borderRight: "none",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Logo header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <Link href="/" onClick={() => handleNav(false)}>
          <Image alt="logo" src={logo} width={130} height={44} style={{ objectFit: "contain" }} />
        </Link>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-track": { background: "transparent" }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.15)", borderRadius: 2 } }}>
        {NAV_SECTIONS.map((section, si) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            {si > 0 && (
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }} />
            )}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                px: 2.5,
                pt: si > 0 ? 1.5 : 1,
                pb: 0.5,
                color: SIDEBAR_MUTED,
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {section.label}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNav(item.csv ?? false)}
                  style={{ textDecoration: "none" }}
                  {...(item.target ? { target: item.target, rel: "noopener noreferrer" } : {})}
                >
                  <ListItemButton
                    sx={{
                      px: 2.5,
                      py: 0.75,
                      borderRadius: "6px",
                      mx: 1,
                      mb: 0.25,
                      color: SIDEBAR_TEXT,
                      "&:hover": {
                        backgroundColor: SIDEBAR_HOVER,
                      },
                      "&.Mui-selected": {
                        backgroundColor: SIDEBAR_ACTIVE,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: SIDEBAR_MUTED,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: 400,
                      }}
                    />
                  </ListItemButton>
                </Link>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 1.5, py: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <Link href="/account" onClick={() => handleNav(false)} style={{ textDecoration: "none" }}>
          <ListItemButton sx={{ borderRadius: "6px", py: 0.85, px: 1.5, mb: 0.5, "&:hover": { backgroundColor: SIDEBAR_HOVER } }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Avatar src={avatarSrc} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}>
                {!avatarSrc && initials}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={session?.user ? (session.user.firstName || session.user.userName) : "Account"}
              secondary={session?.user?.userName ? `@${session.user.userName}` : undefined}
              slotProps={{
                primary: { sx: { fontSize: "0.82rem", fontWeight: 500, color: SIDEBAR_TEXT } },
                secondary: { sx: { fontSize: "0.7rem", color: SIDEBAR_MUTED } },
              }}
            />
          </ListItemButton>
        </Link>
        <ListItemButton
          onClick={() => signOut({ callbackUrl: "/" })}
          sx={{ borderRadius: "6px", py: 0.85, px: 1.5, "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" } }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "rgba(239,68,68,0.75)" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" slotProps={{ primary: { sx: { fontSize: "0.82rem", fontWeight: 500, color: "rgba(239,68,68,0.85)" } } }} />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
