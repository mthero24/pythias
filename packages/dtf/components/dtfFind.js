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
import { DTFBody } from "./DTFBody";
export function DTFFind({}){
    const [submitted, setSubmitted] = useState([]);
    const [scan, setScan] = useState("")
    const getData = async ()=>{
        console.log(Config)
        let res = await axios.get(`/api/production/dtf?pieceID=${scan}`)
        console.log(res.data)
        if(res.data.error) return alert(res.data.msg)
        else setSubmitted(res.data);
        setScan("")
    }
    return (
        <DTFBody submitted={submitted} scan={scan} setScan={setScan} getData={getData} type={"find"} />
    )
}