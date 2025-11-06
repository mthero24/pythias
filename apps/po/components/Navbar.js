"use client";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import {signOut} from "next-auth/react"
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
import { sign } from "crypto";
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
            <Link href="https://www.printoracle.com/dashboard">
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
          <Button color="inherit" onClick={()=>{signOut({callbackUrl: "https//wwww.printoracle.com/"})}}>
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
        <Link href="/">
          <ListItemButton>
            <ListItemText primary={`Production`} />
          </ListItemButton>
        </Link>
        <Link href="/edit-data">
          <ListItemButton>
            <ListItemText primary={`Edit Data`} />
          </ListItemButton>
        </Link>
        <Link href="/print-labels">
          <ListItemButton>
            <ListItemText primary={`Print Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/bulk">
          <ListItemButton>
            <ListItemText primary={`Bulk Orders`} />
          </ListItemButton>
        </Link>
        <Link href="/dtf-send">
          <ListItemButton>
            <ListItemText primary={`Load DTF`} />
          </ListItemButton>
        </Link>

        <Link href="/dtf-find">
          <ListItemButton>
            <ListItemText primary={`Find DTF`} />
          </ListItemButton>
        </Link>

        <Link href="/roq-folder">
          <ListItemButton>
            <ListItemText primary={`Folder`} />
          </ListItemButton>
        </Link>

        <Link href="/shipping">
          <ListItemButton>
            <ListItemText primary={`Ship Orders`} />
          </ListItemButton>
        </Link>
        <Link href="/shipping-labels">
          <ListItemButton>
            <ListItemText primary={`Track Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/embroidery">
          <ListItemButton>
            <ListItemText primary={`Embroidery`} />
          </ListItemButton>
        </Link>
        <Link href="/sublimation">
          <ListItemButton>
            <ListItemText primary={`Sublimation`} />
          </ListItemButton>
        </Link>
        <Link href="/inventory">
          <ListItemButton>
            <ListItemText primary={`Inventory`} />
          </ListItemButton>
        </Link>
        <Link href="/inventory-original">
          <ListItemButton>
            <ListItemText primary={`Inventory (Original)`} />
          </ListItemButton>
        </Link>
        <Link href="/clockwise">
          <ListItemButton>
            <ListItemText primary={`Clockwise`} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
);
