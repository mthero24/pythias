"use client";
import {Box, Container, Typography} from "@mui/material";
import {Uploader} from "@pythias/backend"
import axios from "axios";
import btoa from "btoa";
export const Main = ()=>{
    const handleUpload = async (files) => {
        var binary = '';
        var bytes = new Uint8Array(files);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        let base64 = btoa(binary);
        console.log("Base64 encoded data:", base64);
        let res = await axios.post("/api/clockwise", {buff: base64}).catch(err => {
            console.error("Error uploading files:", err);
            alert("Failed to upload files. Please try again.");
        });
        console.log(res);
    }
    return (
        <Container>
            <Box>
                <Typography variant="h4">Upload</Typography>
                <Box sx={{height: "200px", width: "20%" }}>
                    <Uploader afterFunction={handleUpload} type="order" vh={"200px"}/>
                </Box>
            </Box>
        </Container>
    )
}