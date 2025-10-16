import { Box, Modal, Button, Typography, TextField, Grid2 } from "@mui/material";
import React, { use, useEffect, useRef, useState } from "react";
import { VideoUploader } from "../reusable/videoUploader";
import useImage from 'use-image';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Image from "next/image";
const s3 = new S3Client({
    credentials: {
        accessKeyId: 'XWHXU4FP7MT2V842ITN9',
        secretAccessKey: 'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
    }, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"
}); // for S3

export function UploadVideo({ open, setOpen, blank, setBlank, update }) {
    return (
        <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">Upload Video</Typography>
                <Grid2 container spacing={2}>
                    <Grid2 xs={12}>
                        <VideoUploader afterFunction={async (data) => {
                                let bla = {...blank};  
                                console.log(data, "data +++++++")
                                let url = `videos/${Date.now()}.${data.ext}`
                                let params = {
                                    Bucket: "images1.pythiastechnologies.com",
                                    Key: url,
                                    Body: data.url,
                                    ACL: "public-read",
                                    ContentEncoding: "base64",
                                    ContentDisposition: "inline",
                                    ContentType: `video/${data.ext}`,
                                };
                                const data2 = await s3.send(new PutObjectCommand(params));
                                await new Promise(r => setTimeout(r, 1000))
                                console.log(bla.videos, "videos")
                                bla.videos.push(`https://images1.pythiastechnologies.com/${url}`)
                                update({ blank: { ...bla } });
                            setBlank({ ...bla })
                                setOpen(false);
                            }} /> 
                    </Grid2>
                </Grid2>
            </Box>
        </Modal>
    )
}
