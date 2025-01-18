"use client"
import {
    Typography,
    Container,
    Grid2,
    Box,
    Button,
    TextField
  } from "@mui/material";
import { useState } from "react";
import React from "react";
import axios from "axios";
import Image from "next/image";
import {Config} from "../config"

export function DTFBody({submitted, scan, setScan, getData}){
    return (
            <Container maxWidth="lg">
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", paddingTop: "1%", marginTop: "1%"}}>
                    <TextField autoFocus value={scan} label="Enter Piece ID" onChange={()=>{setScan(event.target.value)}} onKeyDown={()=>{if(event.key === "Enter" || event.key ===13) getData() }} />
                </Box>
                <Grid2 container spacing={2}>
                <Grid2
                        size={{xs: 12, md: submitted && submitted.backDesign? 4: 6}}
                        sx={{display: submitted && submitted.styleImage? "block": "none"}}
                      >
                        <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", padding: "1%"}}>
                        <Image
                          width={350}
                          alt="style"
                          height={350}
                          sx={{
                            backgroundColor: "#e1e1e1e1",
                          }}
                          src={submitted && submitted.styleImage? submitted.styleImage: "/blank.jpg"}
                        />
                        </Box>
                      </Grid2>
                      {submitted && submitted.frontDesign && (
                        <Grid2
                        size={{xs: 12, md: submitted && submitted.backDesign? 4: 6}}
                          
                        >
                            <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "1%", backgroundColor: "#e1e1e1e1"}}>
                            <Image
                            width={350}
                            alt="front design"
                            height={350}
                            sx={{
                              backgroundColor: "#e1e1e1e1",
                            }}
                            src={submitted && submitted.frontDesign? submitted.frontDesign: "/blank.jpg"}
                          />
                            </Box>
                        </Grid2>
                      )}
                      {submitted && submitted.backDesign && (
                        <Grid2
                        size={{xs: 12, md: 4}}
                          s={6}
                          sx={{
                            backgroundColor: "#e1e1e1e1",
                          }}
                        >
                            <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "1%", backgroundColor: "#e1e1e1e1"}}>
                            <Image
                                width={350}
                                alt="back design"
                                height={350}
                                sx={{
                                backgroundColor: "#e1e1e1e1",
                                }}
                                src={submitted && submitted.backDesign? submitted.backDesign: "/blank.jpg"}
                            />
                          </Box>
                        </Grid2>
                      )}
                </Grid2>
            </Container>
        )
}