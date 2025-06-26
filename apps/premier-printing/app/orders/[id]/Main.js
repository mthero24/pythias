"use client"
import {Card, Box, Typography, Accordion, Button, AccordionSummary, AccordionDetails, Grid2, Modal, Link, TextField, Snackbar, IconButton} from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import {useState, Fragment} from "react"
import CreatableSelect from "react-select/creatable";
import axios from "axios"
import Search from "@/app/admin/designs/Search";
import Image from "next/image";
import {Repull} from "@pythias/repull"
import { NoteSnackBar } from "./NoteSnackBar";
const ups = ["TSC", "Zulily"]
export function Main({ord, blanks}){
    const [order, setOrder] = useState(ord);
    const [item, setItem] = useState(null);
    const [blank, setBlank] = useState(null)
    const [size, setSize] = useState(null)
    const [color, setColor] = useState(null)
    const [openUpdate, setOpenUpdate] = useState(false)
    const [openDesign, setOpenDesign] =useState(false)
    const [shipped, setShipped] = useState(false)
    const [note, setNote] = useState(false)
    const [showNotes, setShowNotes] = useState(order.notes.length > 0?true: false)
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
           
            <NoteSnackBar notes={order.notes} open={showNotes} setOpen={setShowNotes}/>
            
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", padding: '.5%'}}>
                <Box sx={{margin: ".5%"}}>
                    <Button sx={{background: "red", color: "#fff"}} onClick={()=>{setNote(true)}}>Create Note</Button>
                </Box>
                <Box sx={{margin: ".5%"}}>
                    <Button sx={{background: "blue", color: "#fff"}} onClick={()=>{setShowNotes(true)}}>Show Notes</Button>
                </Box>
            </Box>
            <Card sx={{minHeight: "100vh", padding: "3%"}}>
                <Typography sx={{textAlign: "center", fontWeight: 900, fontSize: "2rem", padding: "2%", "&:hover": {cursor: order.status.toLowerCase() != "shipped"? "pointer": "", opacity: order.status.toLowerCase() != "shipped"? 0.6: 1}}} onClick={()=>{
                    if(order.status.toLowerCase() != "shipped"){
                        setShipped(true)
                    }
                }}>{order.status}</Typography>
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
                <Grid2 size={{xs: 12, sm:8}}>
                    <Box sx={{margin: "2% 0%"}}>
                        {order.items.map(i=>(
                            <Accordion key={i._id} sx={{margin: "1% 0%"}}>
                                <AccordionSummary sx={{textAlign: "center", background: i.design == undefined || Object.keys(i.design).length == 0 || i.size == undefined || i.color == undefined || i.blank == undefined? "red": "", color: i.design == undefined || Object.keys(i.design).length == 0 || i.size == undefined || i.color == undefined || i.blank == undefined? "#fff": "#000"}} >
                                    <Grid2 container>
                                        <Grid2 size={3}>
                                            {Object.keys(i.design? i.design: {}).filter(k=> i.design[k] != undefined).map(key=>(
                                                <Image key={key} src={`/api/renderImages/${i.styleCode}-${i.colorName}-${key}.jpg?blank=${i.styleCode}&colorName=${i.colorName}&design=${i.design[key]}&width=400&side=${key}`} alt={i.sku} width={400} height={400} style={{width: "100%", height: "auto"}}/>
                                            ))}
                                        </Grid2>
                                        <Grid2 size={1}>

                                        </Grid2>
                                        <Grid2 size={8}>
                                             <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center", textAlign: "center", width: "100%", "&:hover": {opacity: 0.5}}}>
                                                <Typography onClick={()=>{handleItemUpdate(i)}}>{i.name}</Typography>
                                                <Typography onClick={()=>{handleItemUpdate(i)}}>{i.sku}</Typography>
                                                <Typography onClick={()=>{handleItemUpdate(i)}}>{i.upc}</Typography>
                                                <Typography onClick={()=>{handleItemUpdate(i)}}>Color: {i.colorName}, Size: {i.sizeName}, Blank: {i.styleCode}</Typography>
                                                { <Button onClick={()=>{setItem(i); setOpenDesign(true)}}>Missing/Change Design!!</Button>}
                                                {i.design == undefined && <Button sx={{color: "#e2e2e2"}} href={`/admin/design/${i.designRef}`}>Missing Design Images!!</Button>}
                                            </Box>
                                        </Grid2>
                                    </Grid2>
                                </AccordionSummary>
                                <AccordionDetails>
                                <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center"}} >
                                        <Typography>Piece Id: {i.pieceId}</Typography>
                                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center",}}>
                                            {i.steps.map(s=>(
                                                <Box key={s._id} sx={{ margin: "1%", width: "100px"}}>
                                                    <Typography>{s.status}</Typography>
                                                    <Typography>{new Date(s.date).toLocaleDateString("En-us")}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </Grid2>
                <Grid2 size={{xs:12, sm: 4}}>
                    <Card sx={{padding: "2%", textAlign: "center"}}>
                        <Typography>Shipping Info</Typography>
                        {order.shippingInfo.labels.map(l=>(
                            <Typography key={l._id}>Tracking: <Link target="_blank" href={ups.includes(order.marketplace)? `https://www.ups.com/track?track=yes&trackNums=${l.trackingNumber}&loc=en_US&requester=ST/`: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${l.trackingNumber}`}>{l.trackingNumber}</Link></Typography>
                        ))}
                    </Card>
                </Grid2>
            </Card>
            <UpdateModal open={openUpdate} setOpen={setOpenUpdate} item={item} setItem={setItem} blank={blank} setBlank={setBlank} size={size} setSize={setSize} color={color} setColor={setColor} blanks={blanks} setOrder={setOrder}/>
            <AddDesignModal open={openDesign} setOpen={setOpenDesign} item={item} setItem={setItem} setOrder={setOrder}/>
            <ShippedModal open={shipped} setOpen={setShipped} order={order} setOrder={setOrder}/>
            <NoteModal open={note} setOpen={setNote} order={order} setOrder={setOrder} setNotesOpen={setShowNotes}/>
            <Repull />
        </Box>
    )
}

const NoteModal = ({open, setOpen, order, setOrder, setNotesOpen})=>{
    const [note, setNote] = useState("")
     const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        height: "60%",
        overflow: "auto",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const addNote = async ()=>{
        let res = await axios.post("/api/orders/notes", {note, order})
        if(res && res.data.error) alert(res.data.msg)
        else{
            setNote("")
            setOrder(res.data.order)
            setOpen(false)
            setNotesOpen(true)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
               Add Note
            </Typography>
            <Box sx={{padding: ".5%"}}>
                <TextField fullWidth multiline label="Note..." value={note} rows={6} onChange={()=>{
                    setNote(event.target.value)
                }} />
            </Box>
            <Box sx={{padding: ".5%"}}>
                <Button fullWidth onClick={addNote}>Add Note</Button>
            </Box>
        </Box>
      </Modal>
    )
}
const ShippedModal = ({open, setOpen, order, setOrder})=>{
    const [trackingNumber, setTrackingNumber] = useState("");
    const [provider, setProvider] = useState("") 
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        height: "50%",
        overflow: "auto",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const setShipped = async ()=>{
        let res = await axios.post("/api/orders/shipped", {order, trackingNumber, provider})
        if(res && res.data.error) alert(res.data.msg)
        else{
            setTrackingNumber(null)
            setProvider("")
            setOrder(res.data.order)
            setOpen(false)
        }
    }
     return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
               Mark Shipped
            </Typography>
            <Box sx={{padding: ".5%"}}>
                <TextField fullWidth label="Tracking Number" value={trackingNumber} onChange={()=>{
                    setTrackingNumber(event.target.value)
                }} />
            </Box>
            <Box sx={{padding: ".5%"}}>
                <TextField fullWidth label="Shipping Provider" value={provider} onChange={()=>{
                    setProvider(event.target.value)
                }} />
            </Box>
            <Box sx={{padding: ".5%"}}>
                <Button fullWidth onClick={setShipped}>Mark Shipped</Button>
            </Box>
        </Box>
      </Modal>
    )
}
const AddDesignModal = ({open, setOpen, item, setItem, setOrder})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        overflow: "auto",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };
      const [designs, setDesigns] = useState([])
      const [search, setSearch] = useState("")
      const [page, setPage] = useState(1)
      const [hasMore, setHasMore] = useState(true)
      const [design, setDesign] = useState()
      const updateItem = async ()=>{

        let res = await axios.put("/api/admin/items", {item})
        if(res.data.error) alert(res.data.msg)
        else {
            setOrder(res.data.order)
            setItem(null)
            setOpen(false)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Update Item: {item?.sku}
            </Typography>
            <Search setDesigns={setDesigns} search={search} setSearch={setSearch} setPage={setPage} setHasMore={setHasMore}/>
            <Grid2 container spacing={2} sx={{marginTop: "1%"}}>
                {designs && designs.map(d=>(
                    <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                        <Box sx={{opacity: design == d._id? .5: 1,}} onClick={()=>
                            {
                                let i = {...item}
                                i.designRef = d._id
                                i.design =d.images
                                setItem({...i})
                                setDesign(d._id) 

                            }}>
                            <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                <Box sx={{padding: "1% 3%", maxHeight: "250px", minHeight: "250px", height: "250px", background: "#e2e2e2"}}>
                                    <Image src={d.images?.front? d.images.front: d.images?.back? d.images?.back: d.images?.leftSleeve? d.images?.leftSleeve: d.images?.rightSleeve? d.images?.rightSleeve: d.images?.pocket? d.images?.pocket: "/missingImage.jpg"} width={150} height={150} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "250px", background: "#e2e2e2"}}/>
                                </Box>
                                <hr/>
                                <Box sx={{padding: "3%"}}>
                                    <Typography sx={{fontSize: '0.8rem', color: "black"}}>SKU: {d.sku}</Typography>
                                    <Typography sx={{fontSize: '0.8rem', color: "black"}}>{d.name}</Typography>
                                </Box>
                            </Card>
                        </Box>
                    </Grid2>
                ))}
            </Grid2>
            {hasMore && <Button onClick={()=>{setPage(page + 1)}} fullWidth>Next Page</Button>}
            <Button fullWidth onClick={()=>{updateItem()}}>Update Item</Button>
        </Box>
      </Modal>
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
        i.blank = blanks.filter(b=> b._id.toString() == val)[0]
        i.styleCode = i.blank.code
        setBlank(i.blank)
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
                Update Item: {item?.sku} {item?.upc}
            </Typography>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Blank"
                    value={item?.blank? {label: item.blank?.code, value: item.blank?._id}: null}
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