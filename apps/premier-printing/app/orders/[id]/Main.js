"use client"
import {Card, Box, Typography, Accordion, Button, AccordionSummary, AccordionDetails, Grid2, Modal} from "@mui/material"
import {useState, useEffect} from "react"
import CreatableSelect from "react-select/creatable";
import axios from "axios"
import { isAssetError } from "next/dist/client/route-loader";
export function Main({ord, blanks}){
    const [order, setOrder] = useState(ord);
    const [item, setItem] = useState(null);
    const [blank, setBlank] = useState(null)
    const [size, setSize] = useState(null)
    const [color, setColor] = useState(null)
    const [openUpdate, setOpenUpdate] = useState(false)
    const handleItemUpdate = (i)=>{
        console.log("handleItemUpdate")
        let b
        let s
        let c
        if(i.blank) b= blanks.filter(bl=> bl._id.toString() == i.blank.toString())[0]
        console.log(b)
        if(b && i.size) s = b.sizes.filter(si=> si._id.toString() == i.size.toString())[0]
        if(b && i.color) c = b.colors.filter(co=> co._id.toString() == i.color.toString())[0]
        setItem(i)
        setBlank(b)
        setSize(s)
        setColor(c)
        setOpenUpdate(true)
    }
    return (
        <Box sx={{padding: "2%", background: "#e2e2e2"}}>
            <Card sx={{minHeight: "100vh", padding: "3%"}}>
                <Typography sx={{textAlign: "center", fontWeight: 900, fontSize: "2rem", padding: "2%"}}>{order.status}</Typography>
                <Grid2 container spacing={2}>
                    <Grid2 size={{xs: 12, sm:8, md: 8}}>
                        <Card sx={{padding: "2%", minHeight: "100%"}}>
                            <Grid2 container>
                                <Grid2 size={6}>
                                    <Typography>Order Id: {order.orderId}</Typography>
                                    <Typography>Order Key: {order.orderKey}</Typography>
                                    <Typography>PO Number: {order.poNumber}</Typography>
                                </Grid2>
                                <Grid2 size={6}>
                                    <Typography>Marketplace: {order.marketplace}</Typography>
                                    <Typography>ShippingType: {order.shippingType}</Typography>
                                </Grid2>
                            </Grid2>
                        </Card>
                    </Grid2>
                    <Grid2 size={{xs: 12, sm:4, md: 4}}>
                        <Card sx={{textAlign: "center", minHeight: "100%"}}>
                            <Typography>Shipping Address</Typography>
                            <Typography>{order.shippingAddress.name}</Typography>
                            <Typography>{order.shippingAddress.address1}</Typography>
                            <Typography>{order.shippingAddress.address2}</Typography>
                            <Typography>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zip.split("-")[0]}</Typography>
                            <Typography>{order.shippingAddress.country}</Typography>
                        </Card>
                    </Grid2>
                </Grid2>
                <Box sx={{margin: "2% 0%"}}>
                    {order.items.map(i=>(
                        <Accordion key={i._id} sx={{margin: "1% 0%"}}>
                            <AccordionSummary sx={{textAlign: "center", background: i.design == undefined || i.size == undefined || i.color == undefined || i.blank == undefined? "red": "", color: i.design == undefined || i.size == undefined || i.color == undefined || i.blank == undefined? "#fff": "#000"}} >
                                <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center", "&:hover": {opacity: 0.5}}}>
                                    <Typography onClick={()=>{handleItemUpdate(i)}}>{i.name}</Typography>
                                    <Typography onClick={()=>{handleItemUpdate(i)}}>{i.sku}</Typography>
                                    <Typography onClick={()=>{handleItemUpdate(i)}}>Color: {i.colorName}, Size: {i.sizeName}, Blank: {i.styleCode}</Typography>
                                    {i.designRef == undefined && <Button>Missing Design!!</Button>}
                                    {i.design == undefined && <Button sx={{color: "#e2e2e2"}} href={`/admin/design/${i.designRef}`}>Missing Design Images!!</Button>}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                            <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center"}} >
                                    <Typography>Piece Id: {i.pieceId}</Typography>
                                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                                        {i.steps.map(s=>(
                                            <Box key={s._id}>
                                                <Typography>s.status</Typography>
                                                <Typography>{new Date(s.date).toLocaleDateString("En-us")}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Card>
            <UpdateModal open={openUpdate} setOpen={setOpenUpdate} item={item} setItem={setItem} blank={blank} setBlank={setBlank} size={size} setSize={setSize} color={color} setColor={setColor} blanks={blanks} setOrder={setOrder}/>
        </Box>
    )
}

const UpdateModal = ({open, setOpen, blanks, item, blank, color, size, setItem, setBlank, setSize, setColor, setOrder})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };
    const handleBlankChange = (val)=>{
        let i = {...item}
        i.blank = val
        console.log(i.blank)
        setItem({...i})
    }
    const handleSizeChange = (val)=>{
        let i = {...item}
        i.size = val.value
        i.sizeName = val.label
        console.log(i.size, i.sizeName)
        setItem({...i})
    }
    const handleColorChange = (val)=>{
        let i = {...item}
        i.color = val.value
        i.colorName = val.label
        console.log(i.color, i.colorName)
        setItem({...i})
    }
    const updateItem = async ()=>{
        let res = await axios.put("/api/admin/items", {item})
        if(res.data.error) alert(res.data.msg)
        else {
            setOrder(res.data.order)
            setItem(null)
            setBlank(null)
            setSize(null)
            setColor(null)
            setOpen(false)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
            setBlank(null)
            setSize(null)
            setColor(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Update Item: {item?.sku}
            </Typography>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Blank"
                    value={{label: blank?.code, value: blank?._id}}
                    options={blanks.map(b=>{
                        return {label: b.code, value: b._id}
                    })}
                    onChange={(val)=>{
                        handleBlankChange(val.value)
                    }}
                />
            </Box>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Size"
                    value={item?.size? {label: item?.sizeName, value: item?.size}: null}
                    options={blank?.sizes.map(b=>{
                        return {label: b.name, value: b._id}
                    })}
                    onChange={(val)=>{
                        handleSizeChange(val)
                    }}
                />
            </Box>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Color"
                    value={item?.color? {label: item?.colorName, value: item?.color}: null}
                    options={blank?.colors.map(b=>{
                        return {label: b.name, value: b._id}
                    })}
                    onChange={(val)=>{
                        handleColorChange(val)
                    }}
                />
            </Box>
            <Button fullWidth onClick={()=>{updateItem()}}>Update Item</Button>
        </Box>
      </Modal>
    )
}