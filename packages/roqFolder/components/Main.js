"use client"
import {Box, Card} from "@mui/material"
import {Scan} from "./scan";
import {Images} from "./images"
import {useState, useEffect, use} from "react";
import { Repull } from "../../repull/exports";
import {Footer} from "@pythias/backend";
import { NoteSnackBar } from "./NoteSnackBar";
export const Main = ({source})=>{
    const [auto, setAuto] = useState(true)
    const [item, setItem] = useState()
    const [showNotes, setShowNotes] = useState(false)
    useEffect(()=>{
       // console.log(item, item?.notes, "item notes in useEffect")
        item?.order && item.order.notes.length > 0 ? setShowNotes(true) : setShowNotes(false)
    }, [item])
    return (
        <Box>
            <Box sx={{background: "#d2d2d2", paddingTop: "2%", minHeight: "70vh"}}>
                <Scan auto={auto} setAuto={setAuto} setItem={setItem}/>
                <Box sx={{margin: "0% 5%"}}>
                    <Card>
                        {item && <Images item={item} source={source} />}
                        {item && item.order && item.order.notes && item.order.notes.length > 0 && <NoteSnackBar notes={item.order.notes} open={showNotes} setOpen={setShowNotes} />}
                    </Card>
                </Box>
                <Repull/>
            </Box>
            <Footer fixed={true} />
        </Box>
    )
}