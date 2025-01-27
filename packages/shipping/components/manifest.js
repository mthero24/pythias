"use client";
import {Button, Container, Modal, Box, Typography} from "@mui/material";
import {useState} from "react";
import axios from "axios";
import { BinSettings } from "./binSettings";
import {FeedBack} from "./feedback";
export function Manifest({binCount, setAuto, setBins, modalStyle}){
    const [manifest, setManifest] = useState("https://placehold.co/600x400");
    const [open, setOpen] = useState(false);
    const style = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1100,
        bgcolor: "background.paper",
        border: "2px solid #000",
        boxShadow: 24,
        p: 4,
      };
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
      <Container maxWidth="lf" sx={{ marginTop: "1%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Box
            onClick={() => {
              setAuto(true);
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
          </Box>
          <FeedBack setAuto={setAuto}
          />
          <BinSettings binCount={binCount} setAuto={setAuto} setBinss={setBins} modalStyle={modalStyle}/>
        </Box>
      </Container>
    );
}