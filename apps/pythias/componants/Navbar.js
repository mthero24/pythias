"use client";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { signOut } from "next-auth/react";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import * as Logo from '../public/pythias-logo-new-black-100.png';
import * as GoldLogo from '../public/logo.png';
export default function ButtonAppBar() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ backgroundColor: "#fedd94" }}>
          <IconButton
            size="large"
            edge="start"
            color="#565660"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
           
          </Box>
          <Box sx={{marginRight: "5%"}}>
                <Link href="/">
                    <Image
                        className="img-fluid"
                        width={75}
                        height={40}
                        alt="logo"
                        sx={{width: "100%", height: "auto"}}
                        src={Logo}
                    />
                </Link>
            </Box>
         
          {/* {status !== "authenticated" && 
            <Button sx={{color: "#565660"}} href="/login">
              Login
            </Button> */}
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
        width:"auto",
        p: 3,
        background: "#000",
        color: "#fff",
        height: "150%",
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      <Box sx={{ flexGrow: 1, }}>
        <Link href="/admin">
          <Image className="img-fluid" width="170" src={GoldLogo} />
        </Link>
      </Box>
      <Divider />
      <List sx={{ width: "100%" }}>
        <Link href="/dtf">
          <ListItemButton>
            <ListItemText primary={`DTF Print Software`} />
          </ListItemButton>
        </Link>
        <Link href="/DTG">
          <ListItemButton>
            <ListItemText primary={`DTG Print Software`} />
          </ListItemButton>
        </Link>
        <Link href="/Sublimation">
          <ListItemButton>
            <ListItemText primary={`Sublimation Print Software`} />
          </ListItemButton>
        </Link>
        <Link href="/Analytics">
          <ListItemButton>
            <ListItemText primary={`Analytics`} />
          </ListItemButton>
        </Link>
        <Link href="/inventory-management">
          <ListItemButton>
            <ListItemText primary={`Inventory Management`} />
          </ListItemButton>
        </Link>
        <Link href="/Shipping">
          <ListItemButton>
            <ListItemText primary={`Shipping`} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
);
