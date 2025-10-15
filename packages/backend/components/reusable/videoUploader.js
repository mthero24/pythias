"use client";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {useDropzone} from 'react-dropzone'
import {useState, useCallback} from "react";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Image from "next/image";
import {Grid2, Typography, Box, Card} from "@mui/material";
import btoa from "btoa";
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

export function Uploader2({afterFunction, image, setImage}){
    const onDrop = useCallback(acceptedFiles => {
        // Do something with the files
        console.log(acceptedFiles)
        for (let file of acceptedFiles) {
            readFile(file);
        }
    }, [])
    let readFile = async (file) => {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function () {
            let base64 = reader.result;
           
            afterFunction({url: base64,})
        };

        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    };
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept: {
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
    }})

    return (
        <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
            <Card sx={{width: 400, height: 400, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "9px", cursor: "pointer", background: "#FFFFFF",}}>
                <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                        ( <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center",
                            marginTop: {xs: "20%", sm: "35%"},
                            background: "#e2e2e2",


                        }}><AttachFileIcon/>
                            <Typography>Drop Files Here</Typography>
                            <Typography sx={{fontSize: ".7rem"}}>Or Click To Select File</Typography>
                        </Box>): image? <Box sx={{width: "100%",height: "100%"}}>
                            <Image src={image} alt={location} width={200} height={200} style={{width: "100%", height: "auto"}}/>
                        </Box>
                            
                        :
                        (<Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 400, width: 400,
                        }}>
                            <AttachFileIcon/>
                            <Typography sx={{fontSize: ".7rem"}}>Drop New</Typography>
                            <Typography>Image</Typography>
                            <Typography sx={{fontSize: ".7rem"}}>Or Click To Select File</Typography>
                        </Box>)
                    }
                </div>
            </Card>
        </Box>
    )
}