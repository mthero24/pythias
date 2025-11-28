"use client";
import {Box, Button, Typography, Grid2, Modal} from "@mui/material";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Uploader} from "@pythias/backend"
import CloseIcon from '@mui/icons-material/Close';
export function SublimationImages({design, setDesign, updateDesign, open, setOpen}) {
    const [reload, setReload] = useState(true)
    useEffect(() => {
        if (!reload) setReload(!reload)
    }, [reload])
    const afterFunction = async ({location, url}) => {
        // Handle file upload
        let des = { ...design }
        console.log(des, "+++++ design before upload")
        console.log("Uploaded to:", location, url);
        if (!des.sublimationImages) {
            des.sublimationImages = {}
        }
        console.log
        des.sublimationImages[location] = url
        console.log(des, "+++++ design after upload")
        updateDesign(des)
        setDesign(des)
        setReload(false)
    }
    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: "95%", height: "95%", bgcolor: 'background.paper', boxShadow: 24, p: 4, outline: 'none', overflowY: 'auto' }}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <Box sx={{display: "flex", flexDirection: "column",}}>
                        <Typography variant="h6" gutterBottom>
                            Sublimation Images
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Manage your sublimation images here.
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%", cursor: "pointer", "&:hover": { opacity: .6 } }} onClick={() => setOpen(false)}>
                        <CloseIcon sx={{ color: "#780606" }} />
                    </Box>
                </Box>
                <Grid2 container spacing={2} sx={{mt: 1}}>
                    {/* Add your sublimation image components here */}
                    <Grid2 size={{xs:12, md:4, lg:4}}>
                        <Box sx={{ p: 2, textAlign: 'center'}}>
                            <Image src="/sublimation_guide.png" alt="Sublimation Image 1" width={400} height={400} style={{width: '100%', height: 'auto'}} />
                        </Box>
                    </Grid2>
                    <Grid2 size={{xs:12, md:2, lg:2}}>
                        <Box sx={{border: '1px solid #ccc', borderRadius: 2, p: 1,}}>
                            <Typography variant="small" sx={{ fontSize: "0.6rem"}}>8 - Hood Exterior - left</Typography>
                            <Typography variant="small" sx={{textAlign: "right", fontSize: "0.6rem"}}>7 - Hood Exterior - right</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1 }}>
                                {console.log(design)}
                                {reload &&<Uploader
                                    afterFunction={afterFunction}
                                    image={design.sublimationImages?.hoodOutside}
                                    location={"hoodOutside"}
                                />}
                            </Box>
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ fontSize: "0.6rem" }}>9 - Hood Interior - left</Typography>
                            <Typography variant="small" sx={{ textAlign: "right", fontSize: "0.6rem" }}>10 - Hood Interior - right</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1 }}>
                                {reload && <Uploader
                                    afterFunction={afterFunction}
                                    image={design.sublimationImages?.hoodInside}
                                    location={"hoodInside"}
                                />}
                            </Box>
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>14 - Polo Collar</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.poloCollar}
                                location={"poloCollar"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>15 - Polo Pocket</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.poloPocket}
                                location={"poloPocket"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>5 - Sleeve No Cuff - Right</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.sleeveNoCuffRight}
                                location={"sleeveNoCuffRight"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>3 - Sleeve w/Cuff - Right</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.sleeveWithCuffRight}
                                location={"sleeveWithCuffRight"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>1 - Front Body</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.frontBody}
                                location={"frontBody"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>2 - Back Body</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.backBody}
                                location={"backBody"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>4 Sleeve W/Cuff - Left</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.sleeveWithCuffLeft}
                                location={"sleeveWithCuffLeft"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>6 Sleeve No Cuff - Left</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.sleeveNoCuffLeft}
                                location={"sleeveNoCuffLeft"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 4, md: 2, lg: 2 }}>
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Image src="/american_standard_log.png" alt="Sublimation Image 1" width={400} height={400} style={{ width: '100%', height: 'auto' }} />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>11 - Cuff Right</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.cuffRight}
                                location={"cuffRight"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>13 - Collar</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.collar}
                                location={"collar"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}></Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>12 - Cuff Left</Typography>
                            {reload && <Uploader
                                afterFunction={afterFunction}
                                image={design.sublimationImages?.cuffLeft}
                                location={"cuffLeft"}
                            />}
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 4, md: 2, lg: 2 }}>
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Image src="/american_standard_log.png" alt="Sublimation Image 1" width={400} height={400} style={{ width: '100%', height: 'auto' }} />
                        </Box>
                    </Grid2>
                </Grid2>
            </Box>
        </Modal>
    );
}