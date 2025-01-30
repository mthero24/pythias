"use client"
import {Box, Card} from "@mui/material"
import {Scan} from "./scan";
import {Images} from "./images"
import {useState,} from "react";
export const Main = ({})=>{
    const [auto, setAuto] = useState(true)
    const [item, setItem] = useState()
    return (
        <Box sx={{marginTop: "3%"}}>
            <Scan auto={auto} setAuto={setAuto} setItem={setItem}/>
            <Card>
                {item && <Images item={item} />}
            </Card>
        </Box>
    )
}