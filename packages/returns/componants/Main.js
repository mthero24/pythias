"use client";
import Scan from "./scan"
import { Bins } from "./bins"
import { BinSettings } from "./binSettings"
import {Box} from "@mui/material"
 
export function Main({binCount, bins,}){
    return <Box>
        <Scan />
    </Box>
}