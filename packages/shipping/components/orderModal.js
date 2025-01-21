"use client";
import {Box, Modal, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import {Items} from "./OrderModalComponents/items";
import { Address } from "./OrderModalComponents/address";
import { BinInfo } from "./OrderModalComponents/BinInfo";
import { Actions } from "./OrderModalComponents/Action";
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios"
import { createImage } from "../functions/image";
import {useState} from "react";
export function OrderModal({order, item, bin, setOrder, setItem,setBin, setAuto, show, setShow, style, setBins}){
    const [action, setAction] = useState()
    console.log(createImage("red", "AT", {url: "https://s3.wasabisys.com/teeshirtpalace-node-dev/designs/1734432513522.png&w=256&q=75"}))
    const close = ()=>{
      setShow(false);
      setAuto(true);
      setOrder();
      setItem();
      setBin();
    }
    return (
      <Modal
        open={show}
        onClose={() => {
          close()
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", cursor: "pointer"}}>
            <CloseIcon onClick={()=>{
               close()
            }} />
          </Box>
          <Grid2 container spacing={2}>
            <BinInfo bin={bin} close={close} setBins={setBins}/>
          </Grid2>
          {action && <Actions bin={bin} order={order} item={item} style={style}/>}
          {order && (
            <Card sx={{height: `${style.height * 0.75}px`, overflow: "auto"}}>
              <Box sx={{display: "flex", flexDirection: 'row', justifyContent: "space-evenly"}}>
                <Typography fontWeight="bold" fontSize="1.2rem" sx={{display: {xs: "none", sm: "block"}}}>
                   {new Date(order.date).toLocaleDateString("EN-us")}
                </Typography>
                <Typography fontWeight="bold" fontSize="1.2rem">
                  {order.poNumber} 
                </Typography>
                <Typography fontWeight="bold" fontSize="1.2rem" sx={{display: {xs: "none", sm: "block"}}}>
                   {order.status}
                </Typography>
              </Box>
              <Grid2 container spacing={2}>
                <Address order={order} style={style} />
                <Items order={order} style={style}/>
              </Grid2>
            </Card>
          )}
        </Box>
      </Modal>
    );
}