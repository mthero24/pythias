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
        color: "#fff",
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
          <Link href="/admin" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Premier Printing`} />
          </ListItemButton>
        </Link>
          <Link href="/admin/users" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Users`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/license" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Licenses`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/colors" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Colors`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/blanks" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Blanks`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/designs" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Designs`} />
          </ListItemButton>
        </Link>
        <Link href="/admin/products" onClick={() => handleClose(true)}>
          <ListItemButton>
            <ListItemText primary={`Products`} />
          </ListItemButton>
        </Link>
          <Link href="/admin/fix-upc" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Fix Upc`} />
          </ListItemButton>
        </Link>
        <Link href="/orders" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Orders`} />
          </ListItemButton>
        </Link>
          <Link href="/admin/track-labels" onClick={() => handleClose(false)} >
            <ListItemButton>
              <ListItemText primary={`Track Labels`} />
            </ListItemButton>
          </Link>
          <Link href="/production/print-labels" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Print Labels`} />
          </ListItemButton>
        </Link>
        <Link href="/production/dtf-send">
          <ListItemButton>
            <ListItemText primary={`Load DTF`} />
          </ListItemButton>
        </Link>

          <Link href="/production/dtf-find" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Find DTF`} />
          </ListItemButton>
        </Link>
          <Link href="/production/embroidery" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Embroidery`} />
          </ListItemButton>
        </Link>
          <Link href="/production/roq-folder" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Folder`} />
          </ListItemButton>
        </Link>

          <Link href="/production/shipping" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Ship Orders`} />
          </ListItemButton>
        </Link>
        <Link href="/inventory">
          <ListItemButton>
            <ListItemText primary={`Inventory`} />
          </ListItemButton>
        </Link>
          <Link href="/production/returns" onClick={() => handleClose(false)}>
          <ListItemButton>
            <ListItemText primary={`Returns`} />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  </Drawer>
)};
