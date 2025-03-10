"use client";
import {useState} from "react"
import { Scan } from "./scan";

export function Main({}){
    const [auto, setAuto] = useState(true)
    const [order, setOrder] = useState(null)
    const [printer, setPrinter] = useState("printer1")
    const [type, setType] = useState(null)
    const [submitted, setSubmitted] = useState(null)
    //setSubmitted, auto, setAuto, printer, type
    return <Scan auto={auto} setAuto={setAuto} printer={printer} type={type}/>
}