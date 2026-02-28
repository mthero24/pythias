"use client";
import { Typography, Grid2, Card, Container, Button, TextField, Box, Stack, Pagination, MenuItem } from "@mui/material"
import Image from "next/image"
import {useState} from "react"
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import axios from "axios";
export function productMain({inventory, q, totalCount, p, blanks, fils}) {
    const [query, setQuery] = useState(q || "")
    const [count, setCount] = useState(totalCount || 0)
    const [page, setPage] = useState(p || 1)
    const [editing, setEditing] = useState(null)
    console.log(fils, typeof fils)
    const [filterOpen, setFilterOpen] = useState(fils.blank ? true : false)
    const [filters, setFilters] = useState(fils || { })
    const [invs, setInventory] = useState(inventory || [])
    const handlePageChange = (event, value) => {
        console.log(value)
        setPage(value)
        let url = `/inventory/product?q=${query}&page=${value}&filter=${JSON.stringify(filters)}`
        window.location.href = url
    };
    return <Container>
        <Typography variant="h1" sx={{fontSize: "2rem", marginBottom: "1rem"}}>Product Inventory</Typography>
        <Card sx={{padding: "1%", marginBottom: "1%"}}>
            <Box sx={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <TextField fullWidth label="Search" value={query} onChange={(e) => {
                    setQuery(e.target.value)
                }} onKeyDown={(e)=>{
                    console.log(e.key)
                    if(e.key === "Enter"){
                        let url = `/inventory/product?q=${query}&page=1&filter=${JSON.stringify(filters)}`
                        window.location.href = url
                    }
                }} />
                <Button sx={{ position: "relative", right: "1%", color: "#dad6d6", marginLeft: { xs: "-15%", md: "-5%" }, height: "50px" }} onClick={(e) => {
                    let url = `/inventory/product?q=${query}&page=1&filter=${JSON.stringify(filters)}`
                    window.location.href = url
                }}><SearchIcon  /></Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: "10px" }}>
                <Button onClick={()=>{setFilterOpen(!filterOpen)}}><TuneIcon /></Button>
            </Box>
            {filterOpen && 
                <Grid2 container spacing={2} sx={{alignItems: "center"}}>
                    <Grid2 size={4}>
                        <TextField select fullWidth label="Blank" value={filters.blank} sx={{width: "100%"}} onChange={(e) => {
                            let f = {...filters}
                            f.blank = e.target.value
                            setFilters(f)
                            let url = `/inventory/product?q=${query}&page=1&filter=${JSON.stringify(f)}`
                            window.location.href = url
                        }}>
                            {blanks?.map(b => <MenuItem key={b.code} value={b.code}>{b.code}</MenuItem>)}
                        </TextField>
                    </Grid2>
                    {filters.blank ? <Grid2 size={4}>
                        <TextField select fullWidth label="Color" value={filters.color} sx={{width: "100%"}} onChange={(e) => {
                            let f = {...filters}
                            f.color = e.target.value
                            setFilters(f)
                            let url = `/inventory/product?q=${query}&page=1&filter=${JSON.stringify(f)}`
                            window.location.href = url
                        }}>
                            {blanks.find(b => b.code === filters.blank)?.colors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                        </TextField>
                    </Grid2> : null}
                    {filters.blank ? <Grid2 size={4}>
                        <TextField select fullWidth label="Size" value={filters.size} sx={{width: "100%"}} onChange={(e) => {
                            let f = {...filters}
                            f.size = e.target.value
                            setFilters(f)
                            let url = `/inventory/product?q=${query}&page=1&filter=${JSON.stringify(f)}`
                            window.location.href = url
                        }}>
                            {blanks.find(b => b.code === filters.blank)?.sizes.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                        </TextField>
                    </Grid2> : null}
                    <Grid2 size={12}>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignContent: "center", alignItems: "center" }}>
                            <Button onClick={() => {
                                let f = {}
                                let p = page
                                setFilters(f)
                                let url = `/inventory/product?q=${query}&page=1`
                                window.location.href = url
                            }}>Reset Filters</Button>
                        </Box>
                    </Grid2>
                </Grid2>
            }
        </Card>
        {invs.map(item => {
            let image 
            for(let i of Object.keys(item.design?.images || {})){
                let dimage = item.design?.images[i] !== null ? item.design?.images[i] : null
                if(dimage) {
                    //console.log(item.blank.images)
                    let blankImage = item?.blank?.images.filter(im => im.boxes && im.boxes[i] && im.color.toString() == item.color._id.toString())[0]
                    if(!blankImage) image = dimage
                    else image = `/api/renderImage/${item.design.sku}-${item.blank.code}-${blankImage.image.split("/")[blankImage.image.split("/").length - 1].split(".")[0]}-${item.color.name}-${i}.jpg`
                    break
                }
            }
            return <Card sx={{padding: "1%", marginBottom: "1%"}}>
                <Grid2 container key={item._id} sx={{textAlign: "center", alignItems: "center"}}>
                    <Grid2 size={12}>{<Typography variant="h5" sx={{textAlign: "center"}}>{item.sku}</Typography>}</Grid2>                    
                    <Grid2 size={3}>{image && <Image src={image} width={200} height={200} alt="design image" style={{objectFit: "cover", background: "#e3e3e3"}} />}</Grid2>
                    <Grid2 size={2}>Design: {item.design?.sku}</Grid2>
                    <Grid2 size={2}>Blank: {item.blank?.code}</Grid2>
                    <Grid2 size={2}>Color: {item.color.name}</Grid2>
                    <Grid2 size={1}>Size: {item.size?.name}</Grid2>
                    {editing === item._id ? <Grid2 size={1}><TextField value={item.quantity} label="Quantity" onChange={(e) => {
                        let invst = [...invs]
                        let inv = invst.find(i => i._id === item._id)
                        inv.quantity = parseInt(e.target.value)
                        setInventory(invst)
                    }} /></Grid2> : <Grid2 size={1}>Quantity: {item.quantity}</Grid2>    }
                    {editing === item._id ? <Grid2 size={1}><Button onClick={async () => {
                        let invst = [...invs]
                        let inv = invst.find(i => i._id === item._id)
                        setInventory(invst)
                        setEditing(null)
                        let res = await axios.post(`/api/admin/inventory/product/update`, { id: inv._id, quantity: inv.quantity })
                    }}>Save</Button></Grid2> : <Grid2 size={1}><Button onClick={() => setEditing(item._id)}>Edit</Button></Grid2>}
                </Grid2>
            </Card> 
        })}
        <Stack spacing={2} sx={{ marginTop: "1%", display: "flex", alignItems: "center" }}>
            <Pagination count={Math.ceil(count / 50)} page={page} onChange={handlePageChange} shape="rounded" showFirstButton showLastButton />
        </Stack>
    </Container>
}