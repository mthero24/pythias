"use client";
import {Box, Modal, Typography, Card, TextField} from "@mui/material";
//import {useState} from "react";
import axios from "axios"

export function OrderModal({order, item, bin, setOrder, setItem,setBin, setAuto, show, setShow, style}){
    return(
         <Modal
          open={show}
          onClose={() => {
            setShow(false);
            setAuto(true);
          }}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                {order && (
                    <Card>
                        <Typography>{order.poNumber}</Typography>
                    </Card>
                )}
            </Box>
        </Modal>
    )
}