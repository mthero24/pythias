"use client";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Container,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo_vertical.png";

const links = [];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "#1a1a1a",
        borderRadius: 0,
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "80px",
            padding: { xs: 0, md: 0 },
          }}
        >
          {/* Logo */}
          <Box sx={{ flexShrink: 0 }}>
            <Link href="/">
              <Image
                src={Logo}
                alt="Pythias Technologies"
                width={148}
                height={70}
                priority
              />
            </Link>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {links.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{
              display: { xs: "flex", md: "none" },
              color: "white",
            }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 280,
            backgroundColor: "#1a1a1a",
            color: "white",
          },
        }}
      >
        <Box sx={{ padding: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Image
              src={Logo}
              alt="Pythias Technologies"
              width={100}
              height={50}
              style={{ filter: "invert(1)" }}
            />
            <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <List>
          {links.map((link) => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                onClick={handleDrawerToggle}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
}
