import {Card, TextField} from "@mui/material";
import {useState, useEffect} from "react";
import axios from "axios";
export default function Search({search, setSearch, setDesigns, setHasMore, setPage}){
    const [perform, setPerform] = useState(false)
    useEffect(()=>{
        const getDesigns = async ()=>{
            setPage(1)
            let res = await axios.get(`/api/admin/designs?${search != "" && search != undefined? `q=${search}&`: ""}page=${1}`)
            if(res.data.error) alert(res.data.msg)
            else {
                if(res.data.designs.length < 200) setHasMore(false)
                setDesigns([...res.data.designs])
            }
        }
        console.log("search")
        setHasMore(true)
        getDesigns()
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