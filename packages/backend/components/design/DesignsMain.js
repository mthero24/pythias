"use client";
import {Box, Grid2, Typography, Card, Button, Container, Pagination, Stack, Divider} from "@mui/material";
import {useState} from "react";
import axios from "axios";
import Link from "next/link";
import {Search} from "./Search";
import {Footer} from "../reusable/Footer";
export function Main({designs, ct, query, pa}){
    const [designss, setDesigns] = useState(designs)
    const [search, setSearch] = useState(query)
    const [page, setPage] = useState(pa? parseInt(pa): 1)
    const [checked, setChecked] = useState([])
    const [count, setCount] = useState(ct)
    let updateDesign = async (des)=>{
        let res = await axios.put("/api/admin/designs", {design: {...des}}).catch(e=>{console.log(e.response.data); res = e.response})
        if(res?.data?.error) alert(res.data.msg)
    }
    const createDesign = async()=>{
        let res = await axios.post("/api/admin/designs", {})
        if(res.data.error) alert(res.data.msg)
        else{
            location.href=`/admin/design/${res.data.design._id}`
        }
    }
    console.log(page)
    const handlePageChange = (event, value) => {
        console.log(value)
        location.href = `/admin/designs?page=${value}${search ? `&q=${search}` : ''}`;
        // You would typically fetch new data for the selected page here
        // based on the 'value' (new page number)
        console.log(`Navigating to page: ${value}`);
    };
    return (
        <Box>
            <Container maxWidth="lg">
                <Box sx={{display: "flex",justifyContent: "space-between", padding: "1%"}}>
                    <Typography>There are total of {count} Designs</Typography>
                    <Button onClick={() => { createDesign() }} sx={{ background: "#645D5B", color: "#ffffff", width: "100px", height: "30px", marginTop: ".8%", "&:hover": { background: "#000" }}}>Create</Button>
                </Box>
                <Search setSearch={setSearch} setDesigns={setDesigns} setCount={setCount} setPage={setPage} search={search}/>
                <Card sx={{width: "100%", height: "auto", padding: "1%", margin: "1% 0%"}}>
                    <Box sx={{ minHeight: "80vh",}}>
                        <Grid2 container spacing={2}>
                            {designss && designss.map(d=>{
                                let imageUrl
                                let others = []
                                for(let image of Object.keys(d.images)){
                                    console.log(image, d.images[image])
                                    if(d.images[image]){
                                        d.images[image] = d.images[image].replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")
                                        if(!imageUrl) imageUrl = d.images[image]
                                        else if (d.images[image] != null) others.push(d.images[image])
                                    }
                                }
                                console.log(imageUrl, others)
                                return (
                                    <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                                        <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                            <Link href={`/admin/design/${d._id}`} target="_blank">
                                                <Box sx={{ padding: "3%", background: "#e2e2e2", height: { sm: "250px", md: "232px", lg: "350px" }, minHeight: "250px", display: "flex", alignItems: "center", justifyContent: "center"}}>
                                                    <img src={imageUrl ? `${imageUrl}?width=400` : "/missingImage.jpg"} width={400} height={400} alt={`${d.name} ${d.sku} design`} style={{ width: "auto", height: "auto", maxWidth: others.length > 0 ? "60%" : "100%", maxHeight: others.length > 0 ? "45%" : "100%", background: "#e2e2e2"}}/>
                                                </Box>
                                                {others.length > 0 && <Box sx={{ position: "relative", bottom: "68px", right: "0px", background: "#fff", padding: "5px",  marginBottom: "-50px", maxHeight: "80px", background: "#e2e2e2", borderTop: "1px solid #fff"}}>

                                                    <Box sx={{ display: "flex", flexWrap: "wrap", overflow: "auto", }}>
                                                        {others.map((img, index) => (
                                                            <Box key={index} sx={{ margin: "2px", width: "55px", height: "55px", maxHeight: "55px", maxWidth: "55px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"}}>
                                                                <img src={`${img}?width=100`} width={50} height={50} alt={`Other image ${index}`} style={{ margin: "2px", width: "auto", height: "auto", maxHeight: "50px", maxWidth: "50px",}} />
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>}
                                                <hr/>
                                                <Box sx={{padding: "3%"}}>
                                                    <Typography sx={{fontSize: '0.8rem', color: "black", whiteSpace: "nowrap", overflow: "hidden", display: "block", textOverflow: "ellipsis"}}>SKU: {d.sku}</Typography>
                                                    <Typography sx={{ fontSize: '0.8rem', color: "black", whiteSpace: "nowrap", overflow: "hidden", display: "block", textOverflow: "ellipsis" }}>{d.name}</Typography>
                                                </Box>
                                            </Link>
                                            {console.log(d)}
                                            {(d.sendToMarketplaces == false || d.sendToMarketplaces == undefined) && !checked.includes(d._id.toString()) && <Button onClick={()=>{
                                                console.log(d)
                                                d.sendToMarketplaces = true
                                                console.log(d)
                                                updateDesign({...d})
                                                let c = [...checked]
                                                c.push(d._id.toString)
                                                setChecked(c)
                                            }}>Resend To Market Places</Button>}
                                        </Card>                                
                                    </Grid2>
                                )
                            })}
                        </Grid2>
                        <Stack spacing={2} sx={{marginTop: "1%", display: "flex", alignItems: "center"}}>
                            <Pagination count={Math.ceil(count / 50)} page={page} onChange={handlePageChange} shape="rounded" showFirstButton showLastButton />
                        </Stack>
                    </Box>
                </Card>
            </Container>
            <Footer/>
        </Box>
    )
}