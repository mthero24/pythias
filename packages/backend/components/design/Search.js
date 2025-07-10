"use client";
import {Card, TextField} from "@mui/material";
import {useState, useEffect} from "react";
import axios from "axios";
import { set } from "mongoose";
export function Search({search, setSearch, setDesigns, setCount, setPage}){
    const [perform, setPerform] = useState(false)
    useEffect(()=>{
        const getDesigns = async ()=>{
            setPage(1)
            let res = await axios.get(`/api/admin/designs?${search != "" && search != undefined? `q=${search}&`: ""}page=${1}`)
            if(res.data.error) alert(res.data.msg)
            else {
                if (res.data.designs[0].meta) setCount(res.data.designs[0].meta ? res.data.designs[0].meta.count?.total: 1)
                setCount(res.data.count)
                setDesigns([...res.data.designs])
            }
            setPerform(!perform); 
        }
        if(perform == true){
            console.log("search")
            getDesigns()
        }
    },[perform])
    return(
         <Card sx={{width: "100%", padding: "1%"}}>
            <TextField label="Search..." fullWidth onChange={()=>{setSearch(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter") {
                setPerform(!perform); 
                console.log("enter")

            }}}/>
        </Card>
    )
}