"use client"
import { useState } from "react";
import { DTFBody } from "./DTFBody";
export function DTFFind({}){
    const [auto, setAuto] = useState(true)
    return (
        <DTFBody auto={auto} setAuto={setAuto} type={"find"} />
    )
}