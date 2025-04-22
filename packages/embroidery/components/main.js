"use client";
import {useState} from "react"
import { DTFBody } from "./DTFBody";
import {Printers} from "./printers"
import {Box} from "@mui/material"
export function Main({printers}){
    const [auto, setAuto] = useState(true)
    const [printer, setPrinter] = useState("printer1")
    //setSubmitted, auto, setAuto, printer, type
    return (
        <Box>
            <Printers printers={printers} setPrinter={setPrinter} printer={printer} setAuto={setAuto}/>
            <DTFBody auto={auto} setAuto={setAuto} printer={printer}/>
        </Box>
    )
}