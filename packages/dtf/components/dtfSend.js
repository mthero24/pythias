"use client";
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
import { DTFBody } from "./DTFBody";
import {Printers} from "./printers"
export function DTFSend({printers}){
    const [printer, setPrinter] = useState(printers? printers[0]: "printer1")
    const [auto, setAuto] = useState(true)
    return (
        <>
            <Box sx={{padding: ".5%", background: "#d2d2d2"}}>
                <Printers printers={printers} printer={printer} setPrinter={setPrinter} setAuto={setAuto}/>
            </Box>
            <DTFBody auto={auto} setAuto={setAuto} printer={printer} type={"send"}/>
        </>
    )
}