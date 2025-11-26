"use client";
import {Box, Button, Typography, Grid2, Modal} from "@mui/material";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Uploader} from "@pythias/backend"
export function SublimationImages(){

    return (
        <Modal open={true} >
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: "95%", height: "95%", bgcolor: 'background.paper', boxShadow: 24, p: 4, outline: 'none' }}>
                <Typography variant="h6" gutterBottom>
                    Sublimation Images
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Manage your sublimation images here.
                </Typography>
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
                                <Uploader
                                    onUpload={(files) => {
                                        // Handle file upload
                                        console.log("Uploaded files:", files);
                                    }}
                                    multiple={false}
                                />
                                <Uploader
                                    onUpload={(files) => {
                                        // Handle file upload
                                        console.log("Uploaded files:", files);
                                    }}
                                    multiple={false}
                                />
                            </Box>
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ fontSize: "0.6rem" }}>9 - Hood Interior - left</Typography>
                            <Typography variant="small" sx={{ textAlign: "right", fontSize: "0.6rem" }}>10 - Hood Interior - right</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 1 }}>
                                <Uploader
                                    onUpload={(files) => {
                                        // Handle file upload
                                        console.log("Uploaded files:", files);
                                    }}
                                    multiple={false}
                                />
                                <Uploader
                                    onUpload={(files) => {
                                        // Handle file upload
                                        console.log("Uploaded files:", files);
                                    }}
                                    multiple={false}
                                />
                            </Box>
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>14 - Polo Collar</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>15 - Polo Pocket</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>5 - Sleeve No Cuff - Right</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>3 - Sleeve w/Cuff - Right</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>1 - Front Body</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>2 - Back Body</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>4 Sleeve W/Cuff - Left</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>6 Sleeve No Cuff - Left</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
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
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>13 - Collar</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
                        </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}></Grid2>
                    <Grid2 size={{ xs: 12, md: 2, lg: 2 }}>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, }}>
                            <Typography variant="small" sx={{ marginRight: "20%", fontSize: "0.6rem" }}>12 - Cuff Left</Typography>
                            <Uploader
                                onUpload={(files) => {
                                    // Handle file upload
                                    console.log("Uploaded files:", files);
                                }}
                                multiple={false}
                            />
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