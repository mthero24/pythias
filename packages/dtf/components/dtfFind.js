"use client"
import { useState } from "react";
import { DTFBody } from "./DTFBody";
import { Box } from "@mui/material";
import { Footer } from "@pythias/backend";
export function DTFFind({}){
    const [auto, setAuto] = useState(true)
    return (
        <Box>
            <DTFBody auto={auto} setAuto={setAuto} type={"find"} />
            <Footer fixed={true} />
        </Box>
    )
}