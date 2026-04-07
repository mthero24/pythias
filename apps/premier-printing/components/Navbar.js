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
import { useCSV } from "@pythias/backend";
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
          <Box sx={{ flexGrow: 2 }}>
            <Link href="/admin">
              <Image
                className="img-fluid"
                width={100}
                height={75}
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

const NavDrawer = ({ visible, toggleDrawer, anchor = "left" }) => {
  const { setShow } = useCSV();
  const handleClose = (show) => {
    setShow(show);
    toggleDrawer();
  };
  return (
  <Drawer open={visible} anchor={anchor} onClose={toggleDrawer}>
    <Box
      sx={{
        width:"auto",
        p: 3,
        background: theme.palette.primary.main,
        color: "#000",
        height: "150%",
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      <Box sx={{ flexGrow: 1, }}>
          <Link href="/admin" onClick={() => handleClose(false)}>
          <img className="img-fluid" width="170" src="/premierprinting-logo.png" />
        </Link>
      </Box>
      <Divider />
      <List sx={{ width: "100%" }} >
          <Link href="/admin" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
              <ListItemText primary={`Premier Printing`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/admin/users" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Users`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/license" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Licenses`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/colors" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Colors`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/edit-data" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Edit Data`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/converters" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Converters`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/marketplaces" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
            <ListItemButton>
              <ListItemText primary={`Marketplace Data`} sx={{ color: "#000", textDecoration: "none" }} />
            </ListItemButton>
          </Link>
          <Link href="/admin/pricing" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
            <ListItemButton>
              <ListItemText primary={`Pricing`} sx={{ color: "#000", textDecoration: "none" }} />
            </ListItemButton>
          </Link>
        <Link href="/admin/blanks" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Blanks`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/designs" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Designs`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/admin/products" onClick={() => handleClose(true)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Products`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/admin/fix-upc" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Fix Upc`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/orders" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Orders`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/admin/track-labels" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
            <ListItemButton>
              <ListItemText primary={`Track Labels`} sx={{ color: "#000", textDecoration: "none" }} />
            </ListItemButton>
          </Link>
          <Link href="/production/print-labels" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Print Labels`} sx={{ color: "#000", textDecoration: "none" }}  />
          </ListItemButton>
        </Link>
        <Link href="/production/dtf-send" underline="none" sx={{color: "#000", textDecoration: "none"}} onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Load DTF`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>

          <Link href="/production/dtf-find" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Find DTF`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/production/embroidery" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Embroidery`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/production/roq-folder" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Folder`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>

          <Link href="/production/shipping" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Ship Orders`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
        <Link href="/inventory" underline="none" sx={{color: "#000", textDecoration: "none"}} onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Inventory`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
          <Link href="/inventory/product" underline="none" sx={{color: "#000", textDecoration: "none"}} onClick={() => handleClose(false)}>
            <ListItemButton>
              <ListItemText primary={`Product Inventory`} sx={{ color: "#000", textDecoration: "none" }} />
            </ListItemButton>
          </Link>
          <Link href="/production/returns" onClick={() => handleClose(false)} underline="none" sx={{color: "#000", textDecoration: "none"}}>
          <ListItemButton>
            <ListItemText primary={`Returns`} sx={{ color: "#000", textDecoration: "none" }} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
)};
