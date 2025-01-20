"use client";
import {Box, Modal, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import {Items} from "./OrderModalComponents/items";
import { Address } from "./OrderModalComponents/address";
import { BinInfo } from "./OrderModalComponents/BinInfo";
import { Actions } from "./OrderModalComponents/Action";
import axios from "axios"
import { createImage } from "../functions/image";
import {useState} from "react";
export function OrderModal({order, item, bin, setOrder, setItem,setBin, setAuto, show, setShow, style}){
    const [action, setAction] = useState()
    console.log(createImage("red", "AT", {url: "https://s3.wasabisys.com/teeshirtpalace-node-dev/designs/1734432513522.png&w=256&q=75"}))
    return (
      <Modal
        open={show}
        onClose={() => {
          setShow(false);
          setAuto(true);
          setOrder();
          setItem();
          setBin();
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid2 container spacing={2}>
            <BinInfo bin={bin} />
          </Grid2>
          {action && <Actions bin={bin} order={order} item={item} style={style}/>}
          {order && (
            <Card sx={{height: `${style.height * 0.75}px`, overflow: "auto"}}>
              <Box sx={{display: "flex", flexDirection: 'row', justifyContent: "space-evenly"}}>
                <Typography fontWeight="bold" fontSize="2rem">
                   {new Date(order.date).toLocaleDateString("EN-us")}
                </Typography>
                <Typography fontWeight="bold" fontSize="2rem">
                  {order.poNumber} 
                </Typography>
                <Typography fontWeight="bold" fontSize="2rem">
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