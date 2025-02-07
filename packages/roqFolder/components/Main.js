"use client"
import {Box, Card} from "@mui/material"
import {Scan} from "./scan";
import {Images} from "./images"
import {useState,} from "react";
export const Main = ({})=>{
    const [auto, setAuto] = useState(true)
    const [item, setItem] = useState()
    return (
        <Box sx={{background: "#d2d2d2", paddingTop: "2%", minHeight: "100vh"}}>
            <Scan auto={auto} setAuto={setAuto} setItem={setItem}/>
            <Box sx={{margin: "0% 5%"}}>
                <Card>
                    {item && <Images item={item} />}
                </Card>
            </Box>
        </Box>
    )
}