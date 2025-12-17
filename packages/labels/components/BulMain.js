"use client";
import {Box, Container, Typography, Grid2, Button, Grid} from "@mui/material";
import axios from "axios";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Footer } from "@pythias/backend";
import { useState } from "react";

export function BulkMain({orders}){
    let [open, setOpen] = useState("");
    const print = async (order) => {
        console.log("printing order", order);
        let bulkItems = [];
        let bulkIds = [];
        for(let i of order.items){
            if(i.bulkId && !bulkIds.includes(i.bulkId)){
                bulkIds.push(i.bulkId)
            }
        }
        for(let bulkId of bulkIds){
            let items = order.items.filter(it=> it.bulkId == bulkId)
            bulkItems.push({
                bulkId,
                inventory: items[0].inventory.inventory,
                quantity: items.length,
                totalQuantity: order.items.length,
                blankCode: items[0].styleCode,
                colorName: items[0].colorName,
                sizeName: items[0].sizeName,
                designSku: items[0].designSku,
                sku: items[0].sku,
                type: items[0].type,
                poNumber: order.poNumber,
                order: order,
                design: items[0].design,
                shippingType: order.shippingType,
                items: items,
            })
        }
        console.log(bulkItems);
        let res = await axios.post("/api/production/print-labels/bulk", {items: bulkItems,  poNumber: order.poNumber});
        console.log(res);
    }
    return (
        <Box>
            <Container sx={{paddingTop: 4, paddingBottom: 4, minHeight: "80vh"}}>
                <Typography variant="h4" gutterBottom>Bulk Orders</Typography>
                <Typography variant="body1">Total Bulk Orders: {orders.length}</Typography>
                <Grid2 container spacing={2} sx={{ borderBottom: "1px solid #eee", paddingLeft: 2, paddingRight: 2, marginTop: 2 }}>
                    <Grid2  size={2}>
                        <Typography variant="h6" textAlign={"center"}>Date</Typography>
                    </Grid2>
                    <Grid2  size={3}>
                        <Typography variant="h6" textAlign={"center"}>PoNumber</Typography>
                    </Grid2>
                    <Grid2  size={2}>
                        <Typography variant="h6" textAlign={"center"}>Number Of Items</Typography>
                    </Grid2>
                    <Grid2  size={2}>
                        <Typography variant="h6" textAlign={"center"}>in Stock</Typography>
                    </Grid2>
                    <Grid2 size={2}>
                        <Typography variant="h6" textAlign={"center"}>Out Of Stock</Typography>
                    </Grid2>
                </Grid2>
                {orders.map((order, index)=>{
                    let bulkIds = []
                    for(let i of order.items){
                        if(i.bulkId && !bulkIds.includes(i.bulkId)){
                            bulkIds.push(i.bulkId)
                        }
                    }
                    return (
                        <Grid2 container key={order._id} spacing={2} sx={{ borderBottom: "1px solid #eee", padding: 2, background: index % 2 == 0 ? "#efefef": "#fff" }}>
                            <Grid2  size={2}>
                                <Typography variant="h6" textAlign={"center"}>{new Date(order.date).toLocaleDateString()}</Typography>
                            </Grid2>
                            <Grid2  size={3}>
                                <Typography variant="h6" textAlign={"center"}>{order.poNumber}</Typography>
                            </Grid2>
                            <Grid2  size={2}>
                                <Typography variant="h6" textAlign={"center"}>{order.items.length}</Typography>
                            </Grid2>
                            <Grid2  size={2}>
                                <Typography variant="h6" textAlign={"center"}>{order.items.filter(item => item.inventory?.inventory?.inStock.includes(item._id.toString())).length}</Typography>
                            </Grid2>
                            <Grid2  size={2}>
                                <Typography variant="h6" textAlign={"center"}>{order.items.filter(item => !item.inventory?.inventory?.inStock.includes(item._id.toString())).length}</Typography>
                            </Grid2>
                            <Grid2 size={1}>
                                {<Button variant="contained" color="success" onClick={() => print(order)}>Print</Button>}
                            </Grid2>
                            <Grid2  size={12}>
                                <Box sx={{ display: "flex", flexDirection: "row", gap: 1, justifyContent: 'flex-end', transition: "all 0.3s ease", cursor: "pointer", borderTop: open == order._id.toString() ? "1px solid #ccc" : "none", paddingTop: open == order._id.toString() ? 2 : 0 }}>
                                    {open == order._id.toString() ? <ArrowDropUpIcon onClick={() => setOpen(open == order._id.toString() ? "" : order._id.toString())} /> : <ArrowDropDownIcon onClick={() => setOpen(open == order._id.toString() ? "" : order._id.toString())} /> }
                                </Box>
                                {open == order._id.toString() && (
                                    <Box sx={{marginTop: 2}}>
                                        <Grid2 container spacing={2} sx={{ borderBottom: "1px solid #eee", paddingRight: 1, paddingLeft: 1, marginBottom: 1 }}>
                                            <Grid2 item size={2}>
                                                <Typography variant="h6" textAlign={"center"}>Bulk Id</Typography>
                                            </Grid2>
                                            <Grid2 item size={3}>
                                                <Typography variant="h6" textAlign={"center"}>Inventory Id</Typography>
                                            </Grid2>
                                            <Grid2 item size={1}>
                                                <Typography variant="h6" textAlign={"center"}>Items</Typography>
                                            </Grid2>
                                            <Grid2 item size={1}>
                                                <Typography variant="h6" textAlign={"center"}>In Stock</Typography>
                                            </Grid2>
                                            <Grid2 item size={2}>
                                                <Typography variant="h6" textAlign={"center"}>Needs Ordered</Typography>
                                            </Grid2>
                                            <Grid2 item size={1}>
                                                <Typography variant="h6" textAlign={"center"}>Ordered</Typography>
                                            </Grid2>
                                            <Grid2 item size={2}>
                                                <Typography variant="h6" textAlign={"center"}>Labels Printed</Typography>
                                            </Grid2>
                                        </Grid2>
                                        {bulkIds.map(bulkId=>{
                                            let items = order.items.filter(i=> i.bulkId == bulkId)
                                            console.log(items[0]?.inventory?.inventory)
                                            return (
                                                <Grid2 container key={bulkId} spacing={2} sx={{borderBottom: "1px solid #eee", padding: 1, marginBottom: 2}}>
                                                    <Grid2 item size={2}>
                                                        <Typography variant="h6" textAlign={"center"}>{bulkId}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={3}>
                                                        <Typography variant="h6" textAlign={"center"}>{items[0].inventory?.inventory?.inventory_id}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={1}>
                                                        <Typography variant="h6" textAlign={"center"}>{items.length}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={1}>
                                                        <Typography variant="h6" textAlign={"center"}>{items.filter(item => item.inventory?.inventory?.inStock.includes(item._id.toString())).length}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={2}>
                                                        <Typography variant="h6" textAlign={"center"}>{items.filter(item => item.inventory?.inventory?.attached.includes(item._id.toString())).length}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={1}>
                                                        <Typography variant="h6" textAlign={"center"}>{`${items[0].inventory?.inventory?.orders.map(o => o.items.filter(i => items.map(item => item._id.toString()).includes(i.toString())).length).reduce((accumulator, currentValue) => accumulator + currentValue, 0)}`}</Typography>
                                                    </Grid2>
                                                    <Grid2 item size={2}>
                                                        <Typography variant="h6" textAlign={"center"}>{items.filter(item=> item.labelPrinted == true).length}</Typography>
                                                    </Grid2>
                                                </Grid2>
                                            )
                                        })}
                                    </Box>
                                )}
                            </Grid2>
                        </Grid2>
                    )
                })}
            </Container>
            <Footer />
        </Box>
    )
}