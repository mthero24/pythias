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
import { theme, themeDark } from "./UI/Theme";
import Image from "next/image";
import * as Logo from '../public/premierprinting-logo.png';
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
            color="#565660"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Link href="/admin">
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
          
            <Button sx={{color: "#565660"}} onClick={()=>{signOut({ callbackUrl: "/" })}}>
              Logout
            </Button>
         
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
        background: theme.palette.primary.main,
        color: "#fff",
        height: "150%",
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      <Box sx={{ flexGrow: 1, }}>
        <Link href="/admin">
          <img className="img-fluid" width="170" src="/premierprinting-logo.png" />
        </Link>
      </Box>
      <Divider />
      <List sx={{ width: "100%" }}>
        <Link href="/admin">
          <ListItemButton>
            <ListItemText primary={`Premier Printing`} />
          </ListItemButton>
        </Link>
        <Link href="/register">
          <ListItemButton>
            <ListItemText primary={`Register`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/license">
          <ListItemButton>
            <ListItemText primary={`Licenses`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/blanks">
          <ListItemButton>
            <ListItemText primary={`Blanks`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/designs">
          <ListItemButton>
            <ListItemText primary={`Designs`} />
          </ListItemButton>
        </Link>
        <Link href="/fix-upc">
          <ListItemButton>
            <ListItemText primary={`Fix Upc`} />
          </ListItemButton>
        </Link>
        <Link href="/orders">
          <ListItemButton>
            <ListItemText primary={`Orders`} />
          </ListItemButton>
        </Link>
        <Link href="/production/print-labels">
          <ListItemButton>
            <ListItemText primary={`Print Labels`} />
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
        <Link href="/production/embroidery">
          <ListItemButton>
            <ListItemText primary={`Embroidery`} />
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
        <Link href="/inventory">
          <ListItemButton>
            <ListItemText primary={`Inventory`} />
          </ListItemButton>
        </Link>
        <Link href="/production/returns">
          <ListItemButton>
            <ListItemText primary={`Returns`} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
);
