"use client";
import {Box, Container, TextField, Typography, Card, Button} from "@mui/material";
import {Footer} from "../reusable/Footer.js";
import {useState} from "react";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import axios from "axios";
import { Type } from "@aws-sdk/client-s3";
export function Converters({designConverter, blankConverter, colorConverter, sizeConverter}) {
    console.log( designConverter);
    let [design, setDesign] = useState(designConverter ? designConverter.converter : {});
    let [blank, setBlank] = useState(blankConverter && blankConverter.converter ? blankConverter.converter : {});
    let [color, setColor] = useState(colorConverter? colorConverter.converter : {});
    let [size, setSize] = useState(sizeConverter && sizeConverter.converter ? sizeConverter.converter : {});
    let [oldValue, setOldValue] = useState({design: null, blank: null, color: null, size: null});
    let [newValue, setNewValue] = useState({design: null, blank: null, color: null, size: null});
    let [designOpen, setDesignOpen] = useState(false);
    let [blankOpen, setBlankOpen] = useState(false);
    let [colorOpen, setColorOpen] = useState(false);
    let [sizeOpen, setSizeOpen] = useState(false);
    return(
        <Box>
            <Container>
                <Typography variant="h4" sx={{marginTop: "20px", marginBottom: "20px"}}>Converters</Typography>
                <Card sx={{padding: "20px", marginBottom: "20px"}}>
                    <Typography variant="h6">Design Converter</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginTop: "20px"}}>
                        <TextField
                            label="Old Value"
                            value={oldValue.design}
                            onChange={(e) => setOldValue({...oldValue, design: e.target.value})}
                        />
                        <ArrowRightAltIcon sx={{alignSelf: "center"}}/>
                        <TextField
                            label="New Value"
                            value={newValue.design}
                            onChange={(e) => setNewValue({...newValue, design: e.target.value})}
                        />
                        <Button variant="contained" size="large" sx={{alignSelf: "center"}} onClick={async ()=>{
                            if(oldValue.design && newValue.design && oldValue.design !== "" && newValue.design !== ""){
                                let res = await axios.post("/api/admin/converter", {type: "design", oldValue: oldValue.design, newValue: newValue.design})
                                if(res && res.data) setDesign(res.data.converter)
                                oldValue.design = "";
                                newValue.design = "";
                            }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
                        {designOpen ? 
                            <ArrowDropUpIcon sx={{cursor: "pointer"}} onClick={()=>setDesignOpen(false)}/> 
                            :<ArrowDropDownIcon sx={{cursor: "pointer"}} onClick={()=>setDesignOpen(true)}/>}
                    </Box>
                    {console.log(design, "design")}
                    {designOpen &&
                        <Box sx={{marginTop: "20px", maxHeight: "300px", overflowY: "scroll", backgroundColor: "#f5f5f5", padding: "10px"}}>
                            {Object.keys(design).length === 0 &&    <Typography>No design converters set.</Typography>}
                            {Object.keys(design).map((key, index)=>{
                                return(<Typography key={index}>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {design[key]}</Typography>)
                            })}
                        </Box>
                    }
                </Card>
                <Card sx={{padding: "20px", marginBottom: "20px"}}>
                    <Typography variant="h6">Blank Converter</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                        <TextField
                            label="Old Value"
                            value={oldValue.blank}
                            onChange={(e) => setOldValue({...oldValue, blank: e.target.value})}
                        />
                        <ArrowRightAltIcon sx={{ alignSelf: "center" }} />
                        <TextField
                            label="New Value"
                            value={newValue.blank}
                            onChange={(e) => setNewValue({...newValue, blank: e.target.value})}
                        />
                        <Button variant="contained" size="large" sx={{ alignSelf: "center" }} onClick={async ()=>{
                            if(oldValue.blank && newValue.blank && oldValue.blank !== "" && newValue.blank !== ""){
                                let res = await axios.post("/api/admin/converter", {type: "blank", oldValue: oldValue.blank, newValue: newValue.blank})
                                if(res && res.data) setBlank(res.data.converter)
                                oldValue.blank = "";
                                newValue.blank = "";
                            }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                        {blankOpen ?
                            <ArrowDropUpIcon sx={{ cursor: "pointer" }} onClick={() => setBlankOpen(false)} />
                            : <ArrowDropDownIcon sx={{ cursor: "pointer" }} onClick={() => setBlankOpen(true)} />}
                    </Box>
                    {blankOpen &&
                        <Box sx={{marginTop: "20px", maxHeight: "300px", overflowY: "scroll", backgroundColor: "#f5f5f5", padding: "10px"}}>
                            {Object.keys(blank).length === 0 &&    <Typography>No blank converters set.</Typography>}
                            {Object.keys(blank).map((key, index)=>{
                                return(<Typography key={index}>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {blank[key]}</Typography>)
                            })}
                        </Box>
                    }
                </Card>
                <Card sx={{padding: "20px", marginBottom: "20px"}}>
                    <Typography variant="h6">Color Converter</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                        <TextField
                            label="Old Value"
                            value={oldValue.color}
                            onChange={(e) => setOldValue({...oldValue, color: e.target.value})}
                        />
                        <ArrowRightAltIcon sx={{ alignSelf: "center" }} />
                        <TextField
                            label="New Value"
                            value={newValue.color}
                            onChange={(e) => setNewValue({...newValue, color: e.target.value})}
                        />
                        <Button variant="contained" size="large" sx={{ alignSelf: "center" }} onClick={async ()=>{
                            if(oldValue.color && newValue.color && oldValue.color !== "" && newValue.color !== ""){
                                let res = await axios.post("/api/admin/converter", {type: "color", oldValue: oldValue.color, newValue: newValue.color})
                                if(res && res.data) setColor(res.data.converter)
                                oldValue.color = "";
                                newValue.color = "";
                            }
                        }}>Add</Button>
                    </Box>
                    {console.log(color, "color")}
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                        {colorOpen ?
                            <ArrowDropUpIcon sx={{ cursor: "pointer" }} onClick={() => setColorOpen(false)} />
                            : <ArrowDropDownIcon sx={{ cursor: "pointer" }} onClick={() => setColorOpen(true)} />}
                    </Box>
                    {colorOpen &&
                        <Box sx={{marginTop: "20px", maxHeight: "300px", overflowY: "scroll", backgroundColor: "#f5f5f5", padding: "10px"}}>
                            {Object.keys(color).length === 0 &&    <Typography>No color converters set.</Typography>}
                            {Object.keys(color).map((key, index)=>{
                                return(<Typography key={index}>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {color[key]}</Typography>)
                            })}
                        </Box>
                    }
                </Card>
                <Card sx={{padding: "20px", marginBottom: "20px"}}>
                    <Typography variant="h6">Size Converter</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                        <TextField
                            label="Old Value"
                            value={oldValue.size}
                            onChange={(e) => setOldValue({...oldValue, size: e.target.value})}
                        />
                        <ArrowRightAltIcon sx={{ alignSelf: "center" }} />
                        <TextField
                            label="New Value"
                            value={newValue.size}
                            onChange={(e) => setNewValue({...newValue, size: e.target.value})}
                        />
                        <Button variant="contained" size="large" sx={{ alignSelf: "center" }} onClick={async ()=>{
                            if(oldValue.size && oldValue.size !== "" && newValue.size && newValue.size !== ""){
                                let res = await axios.post("/api/admin/converter", {type: "size", oldValue: oldValue.size, newValue: newValue.size})
                                if(res && res.data) setSize(res.data.converter)
                                oldValue.size = "";
                                newValue.size = "";
                            }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                        {sizeOpen ?
                            <ArrowDropUpIcon sx={{ cursor: "pointer" }} onClick={() => setSizeOpen(false)} />
                            : <ArrowDropDownIcon sx={{ cursor: "pointer" }} onClick={() => setSizeOpen(true)} />}
                    </Box>
                    {sizeOpen &&
                        <Box sx={{ marginTop: "20px", maxHeight: "300px", overflowY: "scroll", backgroundColor: "#f5f5f5", padding: "10px" }}>
                            {Object.keys(size).length === 0 && <Typography>No size converters set.</Typography>}
                            {Object.keys(size).map((key, index) => {
                                return (<Typography key={index}>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {size[key]}</Typography>)
                            })}
                        </Box>
                    }
                </Card>
            </Container>
            <Footer/>
        </Box>
    )
}