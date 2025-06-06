"use client";
import {Box, Button, Typography, Modal, Card, TextField, Grid2} from "@mui/material";
import CreatableSelect from "react-select/creatable";
import {useState, useEffect} from "react";
import axios from "axios";
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "95%",
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

export function AddModal({open, setOpen, li, setLi, setLicenses}){
    const blank = {
        "name": null,
        licenseType: null,
        paymentType: null,
        amount: 0
    }
    const [license, setLicense] = useState(li? li: blank)
    useEffect(()=>{
        if(li){
            setLicense(li)
        }
    },[li])
    let create = async ()=>{
        let res = await axios.post("/api/admin/license", {license})
        if(res.data.error) alert(res.data.msg)
        else{
            setLicense(blank)
            setLi(null)
            setOpen(false)
            setLicenses(res.data.licenses)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{setOpen(false)}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
             <Grid2 container spacing={1}>
                <Grid2 size={{xs: 6,sm: 3}}>
                    <TextField fullWidth label="Name Of License Holder" value={license.name} onChange={()=>{
                        let li = {...license}
                        li.name = event.target.value
                        setLicense({...li})
                    }}/>
                </Grid2>
                <Grid2 size={{xs: 6,sm: 3}}>
                    <TextField fullWidth label="License Type" value={license.licenseType}  onChange={()=>{
                        let li = {...license}
                        li.licenseType = event.target.value
                        setLicense({...li})
                    }}/>
                </Grid2>
                <Grid2 size={{xs: 6,sm: 3}}>
                    <Box sx={{padding: "3%", background: "#e2e2e2", borderRadius: "5px"}}>
                        <CreatableSelect
                            placeholder="Payment Type"
                            options={[{label: "One Time Payment", value: "One Time"}, {label: "Flat Rate Per Unit", value: "Flat Per Unit"}, {label: "Percentage Per Unit", value: "Percentage Per Unit"}]}
                            value={license.paymentType? {label: license.paymentType == "One Time"? "One Time Payment": license.paymentType == "Flat Per Unit"? "FLat Per Unit": "Percentage Per Unit", value: license.paymentType }: null}
                            onChange={(vals)=>{
                                console.log(vals)
                                let d = {...license}
                                d.paymentType = vals.value
                                setLicense({...d})
                            }}
                        />
                    </Box>
                </Grid2>
                <Grid2 size={{xs: 6,sm: 3}}>
                    <TextField fullWidth label="Payment Amount" value={license.amount} onChange={()=>{
                        let li = {...license}
                        li.amount = event.target.value
                        setLicense({...li})
                    }}/>
                </Grid2>
                <Grid2 size={12}>
                    <Button fullWidth sx={{background: "#e2e2e2", color: "#000"}} onClick={()=>{create()}}>{li? "Edit": "Create"}</Button>
                </Grid2>
             </Grid2>
        </Box>
      </Modal>
    )
}