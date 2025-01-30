"use client";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
//import { signOut } from "next-auth/react";
import Link from "next/link";
import { theme, themeDark } from "../UI/Theme";
import Image from "next/image"
export default function ButtonAppBar() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ backgroundColor: theme.palette.primary.main }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Link href="/dashboard">
              <Image
                className="img-fluid"
                width={175}
                height={40}
                alt="logo"
                sx={{width: "100%", height: "auto"}}
                src="/images/logowhite.png"
              />
            </Link>
          </Box>
          <Button color="inherit">
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <NavDrawer visible={drawerVisible} toggleDrawer={toggleDrawer} />
    </>
  );
}

const NavDrawer = ({ visible, toggleDrawer, anchor = "left" }) => (
  <Drawer open={visible} anchor={anchor} onClose={toggleDrawer}>
    <Box
      sx={{
        width: anchor === "top" || anchor === "bottom" ? "auto" : 250,
        p: 3,
        background: "#2F3B49",
        color: "#fff",
        minHeight: "100%"
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Link href="/dashboard">
          <img className="img-fluid" width="170" src="/images/logowhite.png" />
        </Link>
      </Box>
      <Divider />
      <List sx={{ width: "100%" }}>
        <Link href="/production">
          <ListItemButton>
            <ListItemText primary={`Production`} />
          </ListItemButton>
        </Link>
        <Link href="/production/printLabels">
          <ListItemButton>
            <ListItemText primary={`Print Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/production/excess-labels">
          <ListItemButton>
            <ListItemText primary={`Excesss Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/production/items">
          <ListItemButton>
            <ListItemText primary={`Track Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/production/dtf-send">
          <ListItemButton>
            <ListItemText primary={`Load DTF`} />
          </ListItemButton>
        </Link>

        <Link href="/production/dtf-find">
          <ListItemButton>
            <ListItemText primary={`Find DTF`} />
          </ListItemButton>
        </Link>

        <Link href="/production/gtx?printer=printer1">
          <ListItemButton>
            <ListItemText primary={`GTX Printers`} />
          </ListItemButton>
        </Link>

        <Link href="/production/roq-folder">
          <ListItemButton>
            <ListItemText primary={`Folder`} />
          </ListItemButton>
        </Link>

        <Link href="/production/shipping">
          <ListItemButton>
            <ListItemText primary={`Ship Orders`} />
          </ListItemButton>
        </Link>
        <Link href="/production/sublimation">
          <ListItemButton>
            <ListItemText primary={`Sublimation`} />
          </ListItemButton>
        </Link>
        <Link href="/production/buttons">
          <ListItemButton>
            <ListItemText primary={`Print Buttons`} />
          </ListItemButton>
        </Link>
        <Link href="/production/stickers">
          <ListItemButton>
            <ListItemText primary={`Stickers`} />
          </ListItemButton>
        </Link>
        <Link href="/production/gift-messages">
          <ListItemButton>
            <ListItemText primary={`Print Gift Messages`} />
          </ListItemButton>
        </Link>
        <Link href="/production/gift-wrap">
          <ListItemButton>
            <ListItemText primary={`Wrapping Station`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/inventory">
          <ListItemButton>
            <ListItemText primary={`Inventory`} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
);
