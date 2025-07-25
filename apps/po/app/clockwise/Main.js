"use client";
import {Box, Container, Typography} from "@mui/material";
import {Uploader} from "@pythias/backend"
import {useState} from "react";
import axios from "axios";
import btoa from "btoa";
import { set } from "mongoose";
import {LoaderOverlay} from "@pythias/backend";
export const Main = ()=>{
    const [uploading, setUploading] = useState(false);
    const handleUpload = async (files) => {
        setUploading(true);
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
        if(res.data && !res.data.error) {
            alert("Files uploaded successfully!");
            console.log("Files uploaded successfully:", res.data);  
        }else if(res.data.error) {
            alert("Error uploading files: " + res.data.msg);
        }
        console.log(res);
        setUploading(false);
    }
    return (
        <Container>
            <Box>
                <Typography variant="h4">Upload</Typography>
                <Box sx={{height: "200px", width: "20%" }}>
                    <Uploader afterFunction={handleUpload} type="order" vh={"200px"}/>
                </Box>
            </Box>
            {uploading && <LoaderOverlay />}
        </Container>
    )
}