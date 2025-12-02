"use client";
import {Box, Container, TextField, Typography, Card, Button, Modal} from "@mui/material";
import {Footer} from "../reusable/Footer.js";
import {useState} from "react";
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from "axios";
import { Type } from "@aws-sdk/client-s3";
export function Converters({designConverter, blankConverter, colorConverter, sizeConverter, skuConverter}) {
    console.log( designConverter);
    let [design, setDesign] = useState(designConverter ? designConverter.converter : {});
    let [blank, setBlank] = useState(blankConverter && blankConverter.converter ? blankConverter.converter : {});
    let [color, setColor] = useState(colorConverter? colorConverter.converter : {});
    let [size, setSize] = useState(sizeConverter && sizeConverter.converter ? sizeConverter.converter : {});
    let [sku, setSku] = useState(skuConverter && skuConverter.converter ? skuConverter.converter : {});
    let [oldValue, setOldValue] = useState({design: null, blank: null, color: null, size: null, sku: null});
    let [newValue, setNewValue] = useState({design: null, blank: null, color: null, size: null, sku: null});
    let [designOpen, setDesignOpen] = useState(false);
    let [blankOpen, setBlankOpen] = useState(false);
    let [colorOpen, setColorOpen] = useState(false);
    let [sizeOpen, setSizeOpen] = useState(false);
    let [skuOpen, setSkuOpen] = useState(false);
    let [deleteModalOpen, setDeleteModalOpen] = useState(false);
    let [deleteItemType, setDeleteItemType] = useState(null);
    let [deleteItemKey, setDeleteItemKey] = useState(null);
    return(
        <Box>
            <Container>
                <Typography variant="h4" sx={{marginTop: "20px", marginBottom: "20px"}}>Converters</Typography>
                <Card sx={{ padding: "20px", marginBottom: "20px" }}>
                    <Typography variant="h6">Sku Converter</Typography>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                        <TextField
                            label="Old Value"
                            value={oldValue.sku}
                            onChange={(e) => setOldValue({ ...oldValue, sku: e.target.value })}
                        />
                        <ArrowRightAltIcon sx={{ alignSelf: "center" }} />
                        <TextField
                            label="New Value"
                            value={newValue.sku}
                            onChange={(e) => setNewValue({ ...newValue, sku: e.target.value })}
                        />
                        <Button variant="contained" size="large" sx={{ alignSelf: "center" }} onClick={async () => {
                            if (oldValue.sku && newValue.sku && oldValue.sku !== "" && newValue.sku !== "") {
                                let res = await axios.post("/api/admin/converter", { type: "sku", oldValue: oldValue.sku, newValue: newValue.sku })
                                if (res && res.data) setSku(res.data.converter)
                                oldValue.sku = "";
                                newValue.sku = "";
                            }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                        {skuOpen ?
                            <ArrowDropUpIcon sx={{ cursor: "pointer" }} onClick={() => setSkuOpen(false)} />
                            : <ArrowDropDownIcon sx={{ cursor: "pointer" }} onClick={() => setSkuOpen(true)} />}
                    </Box>
                    {console.log(sku, "sku")}
                    {skuOpen &&
                        <Box sx={{ marginTop: "20px", maxHeight: "300px", overflowY: "scroll", backgroundColor: "#f5f5f5", padding: "10px" }}>
                            {Object.keys(sku).length === 0 && <Typography>No sku converters set.</Typography>}
                            {Object.keys(sku).map((key, index) => {
                                return (
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} key={index}>
                                        <Typography>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {sku[key]}</Typography>
                                        <Box onClick={() => {
                                            setDeleteItemType("sku");
                                            setDeleteItemKey(key);
                                            setDeleteModalOpen(true);
                                        }}>
                                            <DeleteIcon sx={{ color: "#a71515ff", cursor: "pointer", padding: "2%" }} />
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    }
                </Card>
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
                                return(
                                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between"}} key={index}>
                                        <Typography>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {design[key]}</Typography>
                                        <Box onClick={()=>{
                                            setDeleteItemType("design");
                                            setDeleteItemKey(key);
                                            setDeleteModalOpen(true);
                                        }}>
                                            <DeleteIcon sx={{color: "#a71515ff", cursor: "pointer", padding: "2%"}} />
                                        </Box>
                                    </Box>
                                )
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
                                return (
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} key={index}>
                                        <Typography>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {blank[key]}</Typography>
                                        <Box onClick={() => {
                                            setDeleteItemType("blank");
                                            setDeleteItemKey(key);
                                            setDeleteModalOpen(true);
                                        }}>
                                            <DeleteIcon sx={{ color: "#a71515ff", cursor: "pointer", padding: "2%" }} />
                                        </Box>
                                    </Box>
                                )
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
                                return (
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} key={index}>
                                        <Typography>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {color[key]}</Typography>
                                        <Box onClick={() => {
                                            setDeleteItemType("color");
                                            setDeleteItemKey(key);
                                            setDeleteModalOpen(true);
                                        }}>
                                            <DeleteIcon sx={{ color: "#a71515ff", cursor: "pointer", padding: "2%" }} />
                                        </Box>
                                    </Box>
                                )
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
                                return (
                                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }} key={index}>
                                        <Typography>{key} <ArrowRightAltIcon sx={{ alignSelf: "center" }} /> {size[key]}</Typography>
                                        <Box onClick={() => {
                                            setDeleteItemType("size");
                                            setDeleteItemKey(key);
                                            setDeleteModalOpen(true);
                                        }}>
                                            <DeleteIcon sx={{ color: "#a71515ff", cursor: "pointer", padding: "2%" }} />
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    }
                </Card>
                <DeleteModal
                    open={deleteModalOpen}
                    onClose={setDeleteModalOpen}
                    onConfirm={async () => {
                        // Add your delete confirmation logic here
                        let res = await axios.put("/api/admin/converter", { type: deleteItemType, key: deleteItemKey });
                        if(res && res.data){
                            if(res.data.error) alert("Error deleting converter: " + res.data.msg);
                            else{
                                if(deleteItemType === "design") setDesign(res.data.converter);
                                else if(deleteItemType === "blank") setBlank(res.data.converter);
                                else if(deleteItemType === "color") setColor(res.data.converter);
                                else if(deleteItemType === "size") setSize(res.data.converter);
                            }

                        }
                        setDeleteItemKey(null);
                        setDeleteItemType(null);
                        setDeleteModalOpen(false);
                    }}
                    itemType={deleteItemType}
                    itemKey={deleteItemKey}
                />
            </Container>
            <Footer/>
        </Box>
    )
}

const DeleteModal = ({open, onClose, onConfirm, itemType, itemKey}) => {
    return(
        <Modal
            open={open}
            onClose={() => onClose(false)}>
            <Box sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,}}>
                <Typography variant="h6" component="h2">
                    Confirm Deletion
                </Typography>
                <Typography sx={{ mt: 2 }}>
                    Are you sure you want to delete the {itemType} converter for "{itemKey}"?
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                    <Button variant="contained" color="error" onClick={onConfirm} sx={{ marginRight: "10px" }}>
                        Delete
                    </Button>
                    <Button variant="outlined" onClick={() => onClose(false)}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    )
}