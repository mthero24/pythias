"use client"
import {
    Container,
    Grid2,
    Box,
    Card
  } from "@mui/material";
import { useState } from "react";
import React from "react";
import Image from "next/image";
import {Scan} from "./scan"
import {createImage} from "../functions/image"
export function DTFBody({auto, setAuto, printer, type}){
    const [submitted, setSubmitted] = useState([]);
    return (
            <Box sx={{padding: ".5%", background: "#d2d2d2", minHeight: "100vh"}}>
                <Scan auto={auto} setAuto={setAuto} setSubmitted={setSubmitted} printer={printer} type={type} />
                <Box sx={{margin: "0% 5%"}}>
                  <Card sx={{width: "100%"}}>
                    <Container maxWidth="sm">
                  <Grid2 container spacing={2}>
                    <Grid2
                          size={{xs: 12, sm: submitted && submitted.backDesign? 4: 6, md: submitted && submitted.backDesign? 4: 6}}
                          sx={{display: submitted && submitted.styleImage? "block": "none"}}
                        >
                          <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", padding: "10%"}}>
                          <Image
                            width={350}
                            alt="style"
                            height={350}
                            style={{
                              width: "100%",
                              height: "auto"
                            }}
                            src={submitted && submitted.styleImage? submitted.styleImage: "/blank.jpg"}
                          />
                          </Box>
                        </Grid2>
                        {submitted && submitted.frontDesign && (
                          <Grid2
                          size={{xs: 12, sm: submitted && submitted.backDesign? 4: 6, md: submitted && submitted.backDesign? 4: 6}}
                            
                          >
                              <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "10%", minHeight: "100%", backgroundColor: "#e1e1e1e1"}}>
                              <Image
                              width={350}
                              alt="front design"
                              height={350}
                              style={{
                                width: "100%",
                                height: "auto"
                              }}
                              src={submitted && submitted.frontDesign? submitted.frontDesign: "/blank.jpg"}
                            />
                              </Box>
                          </Grid2>
                        )}
                        {submitted && submitted.backDesign && (
                          <Grid2
                          size={{xs: 12, sm: 4, md: 4}}
                            s={6}
                            sx={{
                              backgroundColor: "#e1e1e1e1",
                            }}
                          >
                              <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "10%", backgroundColor: "#e1e1e1e1"}}>
                              <Image
                                  width={350}
                                  alt="back design"
                                  height={350}
                                  style={{
                                    width: "100%",
                                    height: "auto"
                                  }}
                                  src={submitted && submitted.backDesign? submitted.backDesign: "/blank.jpg"}
                              />
                            </Box>
                          </Grid2>
                        )}
                        {submitted && submitted.frontDesign && (
                          <Grid2
                          size={{xs: 12, sm: submitted && !submitted.backDesign? 12: 6, md: submitted && !submitted.backDesign? 12: 6}}
                            
                          >
                              <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "10%", }}>
                              <Image
                              width={350}
                              alt="front design"
                              height={350}
                              style={{
                                width: "100%",
                                height: "auto"
                              }}
                              src={submitted && submitted.frontDesign && submitted.source != "PP"? createImage(submitted.colorName, submitted.styleCode, {url: submitted.frontDesign}): submitted && submitted.frontCombo? submitted.frontCombo: "/blank.jpg"}
                            />
                              </Box>
                          </Grid2>
                        )}
                        {submitted && submitted.backDesign && (
                          <Grid2
                          size={{xs: 12, sm: 6, md: 6}}
                            s={6}
                            sx={{
                              backgroundColor: "#e1e1e1e1",
                            }}
                          >
                              <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "10%",}}>
                              <Image
                                  width={350}
                                  alt="back design"
                                  height={350}
                                  style={{
                                    width: "100%",
                                    height: "auto"
                                  }}
                                  src={submitted && submitted.backDesign && submitted.source != "PP"? createImage(submitted.colorName, submitted.styleCode, {url: submitted.backDesign}): submitted && submitted.backCombo? submitted.backCombo: "/blank.jpg"}
                              />
                            </Box>
                          </Grid2>
                        )}
                  </Grid2>
                  </Container>
                  </Card>
                </Box>
            </Box>
        )
}