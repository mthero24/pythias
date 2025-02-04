"use client";
import {Card, Box, Grid2, Typography, Button, Fab} from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import {useState} from "react";

export function Main({labels, rePulls, giftLabels=[]}){
    let [selected, setSelected] = useState([])
    const select = (pieceId)=>{
        let sel = [...selected];
        if(sel.includes(pieceId)){
            sel = sel.filter(s=> s !== pieceId)
        }else{
            sel.push(pieceId)
        }
        setSelected([...sel])
    }
    const selectAllMarketPlaceOrders = ()=>{
        let sel = [...selected]
        Object.keys(labels).map((l, i)=>{
            sel.push(...labels[l].map(k=> {
                if(k.order.poNumber.includes("RT") && k.inventory.quantity > 0) return k.pieceId
            }))
        })
        sel = sel.filter(s=> s != undefined)
        console.log(sel)
        setSelected([...sel])
    }
    let row = {
        display: "flex",
        flexDirection: "row",
        padding: ".5%",
        width: "100%",
        textAlign: "center"
    }
    let topButtons={
        margin: "0% 1%",
        padding: "1%", 
        background: "#0097DC",
        color: "#fff",
        width: "25%"
    }
    return (
        <Box sx={{display: "flex", flexDirection: 'column', alignContent: "center", alignItems: "center", margin: ".5%", background: "#d2d2d2", padding: ".3%"}}>
            
            {selected.length > 0 && (
                <Fab color="primary" variant="extended" aria-label="add" sx={{
                    margin: 0,
                    top: 'auto',
                    right: "45%",
                    bottom: 20,
                    left: 'auto',
                    position: 'fixed',
                }}>
                    <PrintIcon /> Print Selected
                </Fab>
            )}
            <Card sx={{width: "100%", marginBottom: ".5%"}}>
                <Box sx={{...row, justifyContent: "flex-start"}}>
                    <Typography sx={{fontWeight: 900}}>RePulled: {rePulls? rePulls: 0}</Typography>
                </Box>
                <Box sx={{...row, justifyContent: "center"}}>
                    <Button sx={topButtons}>Print Gift Labels: {giftLabels.length}</Button>
                    <Button sx={topButtons}>Restore Que</Button>
                    <Button sx={topButtons}>View Untracked Labels</Button>
                    <Button sx={topButtons} onClick={selectAllMarketPlaceOrders}>Select All Market Place Orders</Button>
                </Box>
            </Card>
            <Grid2 container spacing={1} sx={{width: "100%",}}>
                {labels && Object.keys(labels).map((l, i)=>(
                    <Grid2 size={{xs: 12, sm: 6, md: 6, lg:6}} key={i}>
                        <Card sx={{width: "100%"}}>
                            <Typography sx={{padding: "2%", fontSize: "2rem", fontWeight: 900}}>{l} Labels ({labels[l].length})</Typography>
                            <Box sx={row}>
                                <Button sx={{background: "#f2f2f2", margin: ".2%", color: "#000", "&:hover": {background: "#0079DC", color: "#fff"}}}>Print All {l}</Button>
                            </Box>
                            <Grid2 container spacing={1} sx={{padding: "3%", background: "#0079DC", color: "#fff",}}>
                                <Grid2 size={1} >
                                    <Typography sx={{textAlign: "center"}}>In Stock</Typography>
                                </Grid2>
                                <Grid2 size={{xs:6, sm: 4, md: 3,}}>
                                    <Typography sx={{textAlign: "center"}}>Piece ID</Typography>
                                </Grid2>
                                <Grid2 size={{xs:5, sm: 4, md: 3}}>
                                    <Typography sx={{textAlign: "center"}}>PO Number</Typography>
                                </Grid2>
                                <Grid2 size={{xs: 1, sm:3, md: 2, lg: 1}} sx={{display: {xs: "none", sm: "block"}}}>
                                    <Typography sx={{textAlign: "center"}}>Style</Typography>
                                </Grid2>
                                <Grid2 size={{xs: 1, md:2}} sx={{display: {xs: "none", sm: "none", md: "block"}}}>
                                    <Typography sx={{textAlign: "center"}}>Color</Typography>
                                </Grid2>
                                <Grid2 size={{xs: 1, md:1}} sx={{display: {xs: "none", sm: "none", md: "block"}}}>
                                    <Typography sx={{textAlign: "center"}}>Size</Typography>
                                </Grid2>
                                <Grid2 size={{xs: 1, lg:1}} sx={{display: {xs: "none", sm: "none", md: "none", lg: "block"}}}>
                                    <Typography sx={{textAlign: "center"}}>Date</Typography>
                                </Grid2>
                            </Grid2>
                            {labels[l].map((i, j)=>(
                                <Card onClick={()=>{select(i.pieceId)}} key={j}>
                                    <Grid2 container spacing={1} sx={{padding: "3%", background: selected.includes(i.pieceId)? "#0079DC": j % 2 == 0? "#e2e2e2": "#f2f2f2", cursor: "pointer", color: selected.includes(i.pieceId)? "#fff": "#000"}}>
                                        <Grid2 size={1} >
                                            <Typography sx={{textAlign: "center", color: i.inventory.quantity > 0? "#228C22": i.inventory? i.inventory.quantity + i.inventory.pending_quantity > 0? "#feb204": "#d0342c": "#d0342c"}}>{i.inventory? i.inventory.quantity + i.inventory.pending_quantity: 0}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs:6, sm: 4, md: 3,}}>
                                            <Typography sx={{textAlign: "center"}}>{i.pieceId}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs:5, sm: 4, md: 3}}>
                                            <Typography sx={{textAlign: "center"}}>{i.order.poNumber}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 1, sm:3, md: 2, lg: 1}} sx={{display: {xs: "none", sm: "block"}}}>
                                            <Typography sx={{textAlign: "center"}}>{i.styleCode}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 1, md:2}} sx={{display: {xs: "none", sm: "none", md: "block"}}}>
                                            <Typography sx={{textAlign: "center"}}>{i.colorName.split("/")[0]}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 1, md:1}} sx={{display: {xs: "none", sm: "none", md: "block"}}}>
                                            <Typography sx={{textAlign: "center"}}>{i.sizeName}</Typography>
                                        </Grid2>
                                        <Grid2 size={{xs: 1, lg:1}} sx={{display: {xs: "none", sm: "none", md: "none", lg: "block"}}}>
                                            <Typography sx={{textAlign: "center"}}>{new Date(i.date).toLocaleDateString("En-us")}</Typography>
                                        </Grid2>
                                    </Grid2>
                                </Card>
                            ))}
                        </Card>              
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    )
}