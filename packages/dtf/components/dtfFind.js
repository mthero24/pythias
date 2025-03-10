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
    const [auto, setAuto] = useState(true)
    return (
        <DTFBody auto={auto} setAuto={setAuto} type={"find"} />
    )
}