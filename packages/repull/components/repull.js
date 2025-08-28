"use client";
import {Box, Modal, Fab, Button, TextField} from "@mui/material" ;
import {useState, useEffect} from "react";
import axios from "axios";
import CreatableSelect from "react-select/creatable";
export function Repull({}){
    let [open, setOpen] = useState(false)
    let [reasons, setReasons] = useState([])
    let [repull, setRepull] = useState({
        pieceId: "",
        reason: ""
    })
    useEffect(()=>{
        //console.log(repull)
        const getReasons = async ()=>{
            let res = await axios.get("/api/production/repull")
            if(res.data.error) alert(res.data.msg)
            else{
                console.log(res.data.reasons)
                setReasons(res.data.reasons)
            }
        }
        getReasons()
    }, [open])
    const submit = async ()=>{
        let res = await axios.post("/api/production/repull", repull)
        if(res.data.error) alert(res.data.msg)
        else{
            alert("Item set to repull!")
            setRepull({
                pieceId: "",
                reason: ""
            })
            setOpen(false)
        }
    }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };
    return (
        <Box sx={{position: "sticky", bottom: "25px", left: "25px",}}>
            <Fab sx={{position: "sticky", bottom: "50px", left: "25px", padding: "2%", zIndex: 999, background: "#000", color: "#fff", "&:hover": {background: "#fff", color: "#000",}}} onClick={()=>{setOpen(true)}}>Repull</Fab>
            <Modal
                open={open}
                onClose={()=>{setOpen(false)}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                >
                <Box sx={style}>
                   <TextField fullWidth label="Piece Id" value={repull.pieceId} sx={{margin: "1%"}} onChange={()=>{
                    let r ={...repull};
                    r.pieceId = event.target.value
                    setRepull({...r})
                   }}/>
                   <CreatableSelect
                       isClearable
                       placeholder="Select Reason"
                       options={reasons.map(reason => ({ value: reason.name, label: reason.name }))}
                       onChange={(selected) => {
                           setRepull({ ...repull, reason: selected.value })
                       }}
                   />
                   <Button fullWidth sx={{margin: "1%"}} onClick={submit} >Repull Item</Button>
                </Box>
            </Modal>
        </Box>
        
    )
}