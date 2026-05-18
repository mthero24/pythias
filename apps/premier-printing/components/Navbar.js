"use client";
import { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Avatar, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Chip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import * as Logo from '../public/premierprinting-logo.png';
import { useCSV } from "@pythias/backend";
import axios from "axios";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PaletteIcon from "@mui/icons-material/Palette";
import EditIcon from "@mui/icons-material/Edit";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import BrushIcon from "@mui/icons-material/Brush";
import BlockIcon from "@mui/icons-material/Block";
import InventoryIcon from "@mui/icons-material/Inventory";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FolderIcon from "@mui/icons-material/Folder";
import StorageIcon from "@mui/icons-material/Storage";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import BarChartIcon from "@mui/icons-material/BarChart";

const DRAWER_WIDTH = 268;

const SIDEBAR_BG = "#1a1f2e";
const SIDEBAR_ACTIVE_BG = "rgba(255,255,255,0.10)";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.06)";
const SIDEBAR_TEXT = "rgba(255,255,255,0.82)";
const SIDEBAR_TEXT_DIM = "rgba(255,255,255,0.38)";
const SIDEBAR_ICON = "rgba(255,255,255,0.60)";
const SIDEBAR_ACTIVE_ICON = "#fff";
const SIDEBAR_ACTIVE_TEXT = "#fff";
const SIDEBAR_ACCENT = "#6366f1";

const NAV_SECTIONS = [
  {
    label: "Admin",
    items: [
      { label: "Dashboard",       href: "/admin",           icon: <DashboardIcon fontSize="small" />,        showCSV: false, exact: true },
      { label: "Users",           href: "/admin/users",     icon: <PeopleIcon fontSize="small" />,           showCSV: false },
      { label: "Licenses",        href: "/admin/license",   icon: <CardMembershipIcon fontSize="small" />,   showCSV: false },
      { label: "Colors",          href: "/admin/colors",    icon: <PaletteIcon fontSize="small" />,          showCSV: false },
      { label: "Edit Data",       href: "/admin/edit-data", icon: <EditIcon fontSize="small" />,             showCSV: false },
      { label: "Converters",      href: "/admin/converters",icon: <SyncAltIcon fontSize="small" />,         showCSV: false },
      { label: "Marketplace Data",href: "/marketplaces",         icon: <StorefrontIcon fontSize="small" />,              showCSV: false },
      { label: "Integrations",    href: "/admin/integrations",  icon: <IntegrationInstructionsIcon fontSize="small" />, showCSV: false, permission: "integrations" },
      { label: "Pricing",          href: "/admin/pricing",        icon: <AttachMoneyIcon fontSize="small" />,             showCSV: false },
      { label: "Activity",         href: "/admin/activity",       icon: <BarChartIcon fontSize="small" />,               showCSV: false, charts: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Blanks",   href: "/admin/blanks",   icon: <CheckroomIcon fontSize="small" />,  showCSV: false },
      { label: "Designs",  href: "/admin/designs",  icon: <BrushIcon fontSize="small" />,      showCSV: false },
      { label: "Products", href: "/admin/products", icon: <InventoryIcon fontSize="small" />,  showCSV: true  },
      { label: "Fix UPC",  href: "/admin/fix-upc",    icon: <QrCode2Icon fontSize="small" />,  showCSV: false },
      { label: "AI Blacklist", href: "/admin/ai-blacklist", icon: <BlockIcon fontSize="small" />, showCSV: false },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders", icon: <ShoppingCartIcon fontSize="small" />, showCSV: false },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Track Labels", href: "/admin/track-labels",    icon: <TrackChangesIcon fontSize="small" />,    showCSV: false },
      { label: "Print Labels", href: "/production/print-labels",icon: <PrintIcon fontSize="small" />,           showCSV: false },
      { label: "Load DTF",     href: "/production/dtf-send",   icon: <FileUploadIcon fontSize="small" />,      showCSV: false },
      { label: "Find DTF",     href: "/production/dtf-find",   icon: <FindInPageIcon fontSize="small" />,      showCSV: false },
      { label: "Embroidery",   href: "/production/embroidery", icon: <AutoFixHighIcon fontSize="small" />,     showCSV: false },
      { label: "Folder",       href: "/production/roq-folder", icon: <FolderIcon fontSize="small" />,          showCSV: false },
      { label: "Ship Orders",       href: "/production/shipping",        icon: <LocalShippingIcon fontSize="small" />,   showCSV: false },
      { label: "Track Shipping",    href: "/production/shipping-labels", icon: <TrackChangesIcon fontSize="small" />,    showCSV: false },
    ],
  },
  {
    label: "Inventory & Returns",
    items: [
      { label: "Inventory",         href: "/inventory",         icon: <StorageIcon fontSize="small" />,           showCSV: false },
      { label: "Product Inventory", href: "/inventory/product", icon: <Inventory2Icon fontSize="small" />,        showCSV: false },
      { label: "Returns",           href: "/production/returns",icon: <AssignmentReturnIcon fontSize="small" />,  showCSV: false },
    ],
  },
];

export default function ButtonAppBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatar, setAvatar]         = useState(null);
  const { data: session }           = useSession();
  const pathname                    = usePathname();

  if (pathname === "/login") return null;

  useEffect(() => {
    if (!session?.user) return;
    axios.get("/api/account").then(res => {
      if (!res.data.error && res.data.user?.avatar) setAvatar(res.data.user.avatar);
    }).catch(() => {});
  }, [session?.user?.userName]);

  const initials = session?.user
    ? ((session.user.firstName?.[0] ?? "") + (session.user.lastName?.[0] ?? "")).toUpperCase() || session.user.userName?.[0]?.toUpperCase() || "?"
    : "?";

  const avatarSx = avatar?.startsWith("#") ? { bgcolor: avatar } : {};
  const avatarSrc = avatar?.startsWith("http") ? avatar : undefined;

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          borderBottom: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          color: "#1a1f2e",
        }}
      >
        <Toolbar sx={{ minHeight: "56px !important", px: { xs: 1.5, sm: 2 } }}>
          <Tooltip title="Open menu" placement="bottom">
            <IconButton
              size="medium"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1.5, color: "#1a1f2e" }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Link href="/admin" style={{ display: "flex", alignItems: "center" }}>
            <Image width={110} height={40} alt="Premier Printing" src={Logo} style={{ objectFit: "contain" }} />
          </Link>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="My account">
            <IconButton component={Link} href="/account" size="small" sx={{ mr: 1, p: 0.25 }}>
              <Avatar
                src={avatarSrc}
                sx={{ width: 30, height: 30, fontSize: "0.72rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}
              >
                {!avatarSrc && initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Tooltip title="Sign out">
            <IconButton
              size="small"
              onClick={() => signOut({ callbackUrl: "/" })}
              sx={{
                color: "text.secondary",
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.12)",
                borderRadius: 1.5,
                px: 1.25,
                py: 0.6,
                gap: 0.75,
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.2)" },
              }}
            >
              <LogoutIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>Sign out</Typography>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} avatarSrc={avatarSrc} avatarSx={avatarSx} initials={initials} />
    </>
  );
}

const NavDrawer = ({ open, onClose, avatarSrc, avatarSx = {}, initials = "?" }) => {
  const { setShow } = useCSV();
  const pathname = usePathname();
  const { data: session } = useSession();
  const hasCharts = !!session?.user?.permissions?.charts;
  const permissions = session?.user?.permissions ?? {};

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href);

  const handleNav = (showCSV) => {
    setShow(showCSV);
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
          borderRight: "none",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Logo header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/admin" onClick={() => handleNav(false)} style={{ display: "block" }}>
          <Image width={130} height={46} alt="Premier Printing" src={Logo} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        </Link>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-track": { background: "transparent" }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.15)", borderRadius: 2 } }}>
        {NAV_SECTIONS.map((section, si) => (
          <Box key={section.label} sx={{ mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block", px: 2.5, pt: si === 0 ? 0.5 : 1.5, pb: 0.5,
                color: SIDEBAR_TEXT_DIM,
                textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, fontSize: "0.6rem",
              }}
            >
              {section.label}
            </Typography>
            <List disablePadding>
              {section.items.filter(item => (!item.charts || hasCharts) && (!item.permission || permissions[item.permission])).map((item) => {
                const active = isActive(item);
                return (
                  <Link key={item.href} href={item.href} onClick={() => handleNav(item.showCSV)} style={{ textDecoration: "none" }}>
                    <ListItemButton
                      sx={{
                        mx: 1, borderRadius: 1.5, mb: 0.25,
                        py: 0.85, px: 1.5,
                        backgroundColor: active ? SIDEBAR_ACTIVE_BG : "transparent",
                        borderLeft: active ? `3px solid ${SIDEBAR_ACCENT}` : "3px solid transparent",
                        transition: "background-color 120ms, border-color 120ms",
                        "&:hover": { backgroundColor: active ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: active ? SIDEBAR_ACTIVE_ICON : SIDEBAR_ICON,
                          transition: "color 120ms",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.82rem",
                          fontWeight: active ? 600 : 400,
                          color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
                          noWrap: true,
                        }}
                      />
                    </ListItemButton>
                  </Link>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/account" onClick={() => handleNav(false)} style={{ textDecoration: "none" }}>
          <ListItemButton
            sx={{
              borderRadius: 1.5, py: 0.85, px: 1.5, mb: 0.5,
              "&:hover": { backgroundColor: SIDEBAR_HOVER_BG },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Avatar
                src={avatarSrc}
                sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700, bgcolor: avatarSx.bgcolor ?? "#6366f1", ...avatarSx }}
              >
                {!avatarSrc && initials}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={session?.user ? `${session.user.firstName || session.user.userName}` : "Account"}
              secondary={session?.user?.userName ? `@${session.user.userName}` : undefined}
              primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 500, color: SIDEBAR_TEXT }}
              secondaryTypographyProps={{ fontSize: "0.7rem", color: SIDEBAR_TEXT_DIM }}
            />
          </ListItemButton>
        </Link>
        <ListItemButton
          onClick={() => signOut({ callbackUrl: "/" })}
          sx={{
            borderRadius: 1.5, py: 0.85, px: 1.5,
            "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "rgba(239,68,68,0.75)" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Sign out"
            primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 500, color: "rgba(239,68,68,0.85)" }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};
