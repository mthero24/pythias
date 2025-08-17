"use client";
import {Grid2, Box, Typography, Card, Modal, Button} from "@mui/material"
import { useState } from "react";
import axios from "axios";
export function Printers({printers, printer, setPrinter, setAuto}){
  const [pendingModal, setPendingModal] = useState(false);
  return (
    <Box sx={{ display: "flex", flexDirection: "row", paddingTop: ".5%", background: "#d2d2d2" }}>
      <Box sx={{
         width: { xs: "99%", sm: "96%", md: "90%" },
         marginLeft: { xs: ".5%", sm: "2%", md: "5%" },
          }}>
          <Card
            sx={{
              padding: ".5%",
              background: "#f2f2f2",
            }}
          >
            <Grid2 container spacing={2} sx={{ marginBottom: "1%" }}>
              {printers &&
                printers.map((s) => (
                  <Grid2 size={{ md: 2, sm: 3, xs: 6 }} key={s}>
                    <Card
                      sx={{
                        padding: { xs: "3%", md: "5%" },
                        background: printer == s ? "#0079DC" : "#FFF",
                        color: printer == s ? "#fff" : "#000",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                          setAuto(false);
                          setPrinter(s);
                          setAuto(true);
                      }}
                    >
                      <Typography
                        textAlign="center"
                        fontSize={{ xs: "1rem", md: "1.5rem" }}
                        textTransform={"capitalize"}
                      >
                        {s}
                      </Typography>
                    </Card>
                  </Grid2>
                ))}
              <Grid2 size={{ md: 2, sm: 3, xs: 6 }}>
                <Card
                  sx={{
                    padding: { xs: "4%", md: "6%" },
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setPendingModal(true);
                  }}
                >
                  <Typography
                    textAlign="center"
                    fontSize={{ xs: ".5rem", md: "1.3rem" }}
                    textTransform={"capitalize"}
                  >
                    Print Pending Items
                  </Typography>
                </Card>
              </Grid2>
            </Grid2>
          </Card>
        </Box>
        <PrintPendingModal open={pendingModal} setOpen={setPendingModal} printers={printers} />
      </Box>
    );
}

const PrintPendingModal = ({open, setOpen, printers}) => {
  const [usePrinters, setUsePrinters] = useState([]);
  let style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60%",
    height: "30%",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    overflow: "auto"
  };
  return(
    <Modal
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box sx={style}>
        <Typography variant="h6">Select Printers</Typography>
        <Grid2 container spacing={2}>
          {printers.map((p) => (
            <Grid2 item xs={6} sm={4} md={3} key={p}>
              <Card
                sx={{
                  padding: 2,
                  background: usePrinters.includes(p) ? "#0079DC" : "#FFF",
                  color: usePrinters.includes(p) ? "#fff" : "#000",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setUsePrinters((prev) =>
                    prev.includes(p)
                      ? prev.filter((item) => item !== p)
                      : [...prev, p]
                  );
                }}
              >
                <Typography textAlign="center" fontSize={{ xs: ".5rem", md: "1.5rem" }}
                  textTransform={"capitalize"}>{p}</Typography>
              </Card>
            </Grid2>
          ))}
        </Grid2>
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Handle print pending items
              let res = axios.put("/api/production/dtf", { printers: usePrinters });
              setOpen(false);
            }}
          >
            Print
          </Button>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </Box>
      </Box>
    </Modal>
  )
}