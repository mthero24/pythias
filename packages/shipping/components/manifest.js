"use client";
import {Button, Container, Modal, Box, Typography, TextField, Card} from "@mui/material";
import {useState} from "react";
import axios from "axios";
import { BinSettings } from "./binSettings";
import {FeedBack} from "./feedback";
import CloseIcon from '@mui/icons-material/Close';
export function Manifest({binCount, setAuto, setBins, modalStyle, style}){
    const [manifest, setManifest] = useState("https://placehold.co/600x400");
    const [open, setOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState()
    const submitRefund = async ()=>{
      console.log("refund")
      let res = await axios.put("/api/production/shipping/labels", {PIC: trackingNumber})
      if(res.data.error) alert(res.data.msg)
      else {
        alert(res.data.msg)
        setRefundOpen(false)
        setTrackingNumber()
      }
    }
    const handleOpen = async () => {
        console.log("print manifest");
        console.log(open);
        let result = await axios.get("/api/production/shipping/manifest").catch(e=>{console.log(e.response.data)});
        if (result.data.error) {
          alert(result.data.msg);
        } else {
          console.log(result.data);
          setManifest(`data:image/jpg;base64,${result.data.manifest}`);
          setOpen(true);
        }
      };
    return (
      <Box sx={{margin: {xs:"0%, 1%", sm: "0% 2%",md:"0% 5%"}}}>
      <Card sx={{padding: "2%",}}>
      
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Button onClick={handleOpen}>Manifest</Button>
            <Modal
              open={open}
              onClose={() => {
                setOpen(false);
                setManifest("https://placehold.co/600x400");
              }}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
              <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", cursor: "pointer"}}>
                  <CloseIcon onClick={()=>{
                    setOpen(false);
                    setManifest("https://placehold.co/600x400");
                  }} />
                </Box>
                <Typography
                  id="modal-modal-title"
                  variant="h6"
                  component="h2"
                  sx={{ textAlign: "center" }}
                >
                  PrintManifest
                </Typography>
                <img
                  src={manifest}
                  alt={"manifest"}
                  width={1000}
                  height={1000}
                />
              </Box>
            </Modal>
            <Button onClick={()=>{setRefundOpen(true)}}>Request Refund</Button>
            <Modal
              open={refundOpen}
              onClose={() => {
                setRefundOpen(false);
                setTrackingNumber();
              }}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", cursor: "pointer"}}>
                  <CloseIcon onClick={()=>{
                    setRefundOpen(false);
                  }} />
                </Box>
                <Typography
                  id="modal-modal-title"
                  variant="h6"
                  component="h2"
                  sx={{ textAlign: "center", marginTop: "20%" }}
                >
                  Request Refund
                </Typography>
               <TextField fullWidth label="Tracking Number"  onChange={()=>{setTrackingNumber(event.target.value)}} onKeyDown={()=>{ console.log(event.key);if(event.key == "Enter" || event.key == "ENTER" || event.key ==13) submitRefund()}}/>
              </Box>
            </Modal>
          </Box>
          <FeedBack setAuto={setAuto}
          />
          <BinSettings binCount={binCount} setAuto={setAuto} setBinss={setBins} modalStyle={modalStyle}/>
        </Box>
      </Card>
      </Box>
    );
}