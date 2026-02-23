import { useState, useEffect } from "react"
import { Box, Grid2, Typography, Button, Modal, TextField, FormControlLabel, Checkbox, Divider, Accordion, AccordionActions, AccordionSummary, AccordionDetails, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CircularProgress } from '@mui/material'
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';

export const AddModal = ({ open, setOpen, setNeedsOrdered, needsOrdered, colors, setColors, setBlankCodes, blankCodes, defaultLocation }) => {

    const [blanks, setBlanks] = useState(null)
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState([{ blank: null, color: "", size: "", quantity: 0 }])
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "50%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        height: "60%",
        overflow: "auto"
    };
    useEffect(() => {
        const getBlanks = async () => {
            let res = await axios.get("/api/admin/blanks")
            console.log(res.data)
            setBlanks(res.data.blanks.sort((a, b) => a.code.localeCompare(b.code)))
            setLoading(false)
        }
        if (open && (!blanks || blanks.length <= 0)) {
            getBlanks()
            setLoading(true)
        }

    }, [open])

    const add = async () => {
        if (items && items.length > 0) {
            let res = await axios.post("/api/admin/inventory/create-order/add", { items: items.filter(i => i.blank && i.color && i.size && i.quantity > 0).map(i => ({ blank: i.blank, color: i.blank.colors.find(c => c.name === i.color), size: i.blank.sizes.find(s => s.name === i.size), quantity: i.quantity })) })
            console.log(res.data)
            let no = [...needsOrdered]
            for (let inventory of res.data.inventories) {
                no.push({ inv: inventory.inventory, order: inventory.order, included: true, location: defaultLocation })
            }
            setNeedsOrdered(no)
            let bC = [...blankCodes]
            let cL = [...colors]
            for (let item of items) {
                let blank = blanks.find(b => b.code === item.blank.code)
                let color = item.color
                if (!bC.includes(blank.code)) bC.push(blank.code)
                if (!cL.includes(color)) cL.push(color)
            }
            setBlankCodes(bC)
            setColors(cL)
            setItems([{ blank: null, color: "", size: "", quantity: 0 }])
            setOpen(false)
        }
    }
    return (
        <Modal
            open={open}
            onClose={() => { setOpen(false) }}>
            <Box sx={style}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
                    <CloseIcon sx={{ color: "red", cursor: "pointer" }} onClick={() => { setOpen(false) }} />
                </Box>
                <Typography variant="h6" component="h2">
                    Add Items To Order
                </Typography>
                {!loading && blanks && items && items.map((item, index) => (
                    <Box key={index} sx={{ marginTop: "2%", marginBottom: "2%", borderBottom: "1px solid #000", paddingBottom: "2%" }}>
                        <Grid2 container spacing={1}>
                            <Grid2 size={3}>
                                <TextField select fullWidth label="Blank Code" value={items[index].blank ? items[index].blank.code : ""} onChange={(e) => {
                                    let its = [...items]
                                    let item = its[index]
                                    item.blank = blanks.find(b => b.code === e.target.value)
                                    its[index] = item
                                    setItems([...its])
                                }}>
                                    {blanks?.map(b => <MenuItem key={b.code} value={b.code}>{b.code}</MenuItem>)}
                                </TextField>
                            </Grid2>
                            {items[index].blank && <Grid2 size={3}>
                                <TextField select fullWidth label="Color" value={items[index].color} onChange={(e) => {
                                    let its = [...items]
                                    let item = its[index]
                                    item.color = e.target.value
                                    its[index] = item
                                    setItems([...its])
                                }}>
                                    {items[index].blank?.colors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                                </TextField>
                            </Grid2>}
                            {items[index].blank && <Grid2 size={3}>
                                <TextField select fullWidth label="Size" value={items[index].size} onChange={(e) => {
                                    let its = [...items]
                                    let item = its[index]
                                    item.size = e.target.value
                                    its[index] = item
                                    setItems([...its])
                                }}>
                                    {items[index].blank?.sizes.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                                </TextField>
                            </Grid2>}
                            {items[index].blank && <Grid2 size={3}>
                                <TextField type="number" value={items[index].quantity} fullWidth label="Quantity" onChange={(e) => {
                                    let its = [...items]
                                    let item = its[index]
                                    item.quantity = parseInt(e.target.value)
                                    its[index] = item
                                    setItems([...its])
                                }} />
                            </Grid2>}
                        </Grid2>
                    </Box>))}
                {loading && <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress color="#e2e2e2" sx={{ marginTop: "20px", marginRight: "10px" }} size={25} />
                    <Typography variant="h6" sx={{ display: "block", color: "#e2e2e2", marginTop: "20px", fontSize: "1.6rem", fontWeight: "bold" }}>
                        Loading...</Typography>
                </Box>}
                <Button onClick={() => {
                    let its = [...items]
                    its.push({ blank: null, color: "", size: "", quantity: 0 })
                    setItems(its)
                }}>Add</Button>
                <Divider sx={{ marginTop: "2%", marginBottom: "2%" }} />
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignContent: "center", alignItems: "center" }}>
                    <Button onClick={() => { add() }}>Add Items To Order</Button>
                </Box>
            </Box>
        </Modal>
    )
}