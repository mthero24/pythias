"use client";
import {Box, Modal, Typography, Card, TextField, Grid2} from "@mui/material";
import Image from "next/image"
import axios from "axios"

export function OrderModal({order, item, bin, setOrder, setItem,setBin, setAuto, show, setShow, style}){
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
          {order && (
            <Card>
              <Typography textAlign="center" fontWeight="bold" fontSize="2rem">
                {order.poNumber}
              </Typography>
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{ maxHeight: style.height * 0.5, overflow: "auto" }}
                  >
                    {order.items.map((it, i) => (
                      <Card
                        key={i}
                        sx={{
                          background: i % 2 == 0 ? "#e2e2e2" : "#f2f2f2",
                          padding: ".5%",
                          margin: ".7%",
                        }}
                      >
                        <Image
                          src={it.design?.front.replace(
                            "https://s3.wasabisys.com/teeshirtpalace-node-dev",
                            "https://images2.teeshirtpalace.com"
                          )}
                          alt={it.pieceId}
                          width={100}
                          height={100}
                        />
                      </Card>
                    ))}
                  </Card>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }}>

                </Grid2>
              </Grid2>
            </Card>
          )}
        </Box>
      </Modal>
    );
}