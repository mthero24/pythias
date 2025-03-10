"use client";
import {useState} from "react"
import { DTFBody } from "./DTFBody";

export function Main({}){
    const [auto, setAuto] = useState(true)
    const [printer, setPrinter] = useState("printer1")
    //setSubmitted, auto, setAuto, printer, type
    return <DTFBody auto={auto} setAuto={setAuto} printer={printer}/>
}