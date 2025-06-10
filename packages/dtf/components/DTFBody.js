"use client"
import {
    Container,
    Grid2,
    Box,
    Card,
    Typography
  } from "@mui/material";
import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import {Scan} from "./scan"
import {createImage} from "../functions/image"
import { Repull } from "../../repull/exports";
export function DTFBody({auto, setAuto, printer, type}){
    const [submitted, setSubmitted] = useState([]);
    useEffect(()=>{
      console.log(submitted, "submitted use Effect")
    },[submitted])
    return (
            <Box sx={{padding: ".5%", background: "#d2d2d2", minHeight: "100vh"}}>
                <Scan auto={auto} setAuto={setAuto} setSubmitted={setSubmitted} printer={printer} type={type} />
                <Box sx={{margin: "0% 5%"}}>
                  <Card sx={{width: "100%"}}>
                    <Container maxWidth={submitted?.type == "new"? "md": "md"}>
                      {submitted && submitted.item && <Box sx={{padding: "2%"}}><Typography textAlign={"center"} fontWeight="bold" fontSize={"1.3rem"}>PieceID: {submitted.item.pieceId} Blank: {submitted.item.blank.code} <br/> Color: {submitted.item.colorName} size: {submitted.item.sizeName} Thread Color: {submitted.item.threadColorName} </Typography></Box>}
                    {submitted && submitted.type == undefined &&
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
                          {submitted && submitted.upperSleeveDesign && (
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
                                    src={submitted && submitted.upperSleeveDesign? submitted.upperSleeveDesign: "/blank.jpg"}
                                />
                              </Box>
                            </Grid2>
                          )}
                          {submitted && submitted.lowerSleeveDesign && (
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
                                    src={submitted && submitted.lowerSleeveDesign? submitted.lowerSleeveDesign: "/blank.jpg"}
                                />
                              </Box>
                            </Grid2>
                          )}
                          {submitted && submitted.centerDesign && (
                            <Grid2
                            size={{xs: 12, sm: 4, md: 4}}
                              s={6}
                              sx={{
                                backgroundColor: "#e1e1e1e1",
                              }}
                            >
                              {console.log(submitted.centerDesign, "center design")}
                                <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center", margin: "1%", padding: "10%", backgroundColor: "#e1e1e1e1"}}>
                                <Image
                                    width={350}
                                    alt="back design"
                                    height={350}
                                    style={{
                                      width: "100%",
                                      height: "auto"
                                    }}
                                    src={submitted && submitted.centerDesign? submitted.centerDesign: "/blank.jpg"}
                                />
                              </Box>
                            </Grid2>
                          )}
                          {submitted && submitted.pocketDesign && (
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
                                    src={submitted && submitted.pocketDesign? submitted.pocketDesign: "/blank.jpg"}
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
                          {submitted && submitted.centerDesign && (
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
                                    src={submitted && submitted.centerDesign && submitted.source != "PP"? createImage(submitted.colorName, submitted.styleCode, {url: submitted.centerDesign}): submitted && submitted.centerCombo? submitted.centerCombo: "/blank.jpg"}
                                />
                              </Box>
                            </Grid2>
                          )}
                    </Grid2>
                  }
                  {submitted && submitted.type == "new" && 
                    (
                      <Box>
                        {Object.keys(submitted.images).map(im=>(
                          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "2%", margin: "2%"}}>
                            <Box>
                              <Image
                                  width={500}
                                  alt={`${im}`}
                                  height={500}
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    background: "#e2e2e2"
                                  }}
                                  src={createImage(submitted.colorName, submitted.styleCode, {url: submitted.images[im], side: im == "back" || im == "namePlate"? "back": "front", printArea: im})}
                              />
                            </Box>
                            <Box sx={{ background: "#e2e2e2", padding: "1%"}}>
                              <Image
                                  width={500}
                                  alt="back design"
                                  height={500}
                                  style={{
                                    width: "100%",
                                    height: "auto"
                                  }}
                                  src={submitted.images[im]}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )
                  }
                  </Container>
                  </Card>
                </Box>
                <Repull />
            </Box>
        )
}