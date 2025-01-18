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
import {Printers} from "./SelectPrinters"
export function DTFSend({printers}){
    const [submitted, setSubmitted] = useState([]);
    const [scan, setScan] = useState("")
    const [printer, setPrinter] = useState(printers? printers[0]: "printer1")
    const getData = async ()=>{
        console.log(Config)
        let res = await axios.post(`/api/production/dtf`, {pieceId: scan, printer})
        console.log(res.data)
        if(res.data.error) return alert(res.data.msg)
        else setSubmitted(res.data);
        setScan("")
    }
    return (
        <>
            <Printers printers={printers} printer={printer} setPrinter={setPrinter}/>
            <DTFBody submitted={submitted} scan={scan} setScan={setScan} getData={getData} />
        </>
    )
}