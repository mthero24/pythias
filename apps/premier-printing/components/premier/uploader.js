"use client";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {useDropzone} from 'react-dropzone'
import {useState, useCallback} from "react";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Image from "next/image";
import {Grid2, Typography, Box, Card} from "@mui/material";
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

export function Uploader({afterFunction, location, image, productImage, primary, bl, color, vh}){
    const onDrop = useCallback(acceptedFiles => {
        // Do something with the files
        console.log(acceptedFiles)
        for (let file of acceptedFiles) {
            readFile(file);
        }
    }, [])
    let readFile = async (file) => {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function () {
            console.log(afterFunction, productImage)
            let base64 = reader.result;
            console.log(base64, "base64")
        //   if (resize) base64 = await resizeFunc(base64, width);
            let url = productImage? `products/${Date.now()}.${file.name.split(".")[1]}`: `designs/${Date.now()}.${file.name.split(".")[1]}`
            let params = {
            Bucket: "images1.pythiastechnologies.com",
            Key: url,
            Body: base64,
            ACL: "public-read",
            ContentEncoding: "base64",
            ContentDisposition: "inline",
            ContentType: file.type,
            };
            const data = await s3.send(new PutObjectCommand(params));
            console.log("Success, object uploaded", data);
            afterFunction({url: `https://images1.pythiastechnologies.com/${url}`, location, primary, bl, color})
        };

        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    };
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept: {
    'image/png': ['.png'],
    'image/jpg': ['.jpg'],
    'text/emb': ['.emb'],
    'text/dst': ['.dst'],
    'text/exp': ['.exp'],
    'text/pes': ['.pes'],
    'text/ess': ['.ess'],
    'text/esl': ['.esl']
    }})

    return (
        <Card sx={{width: "100%", padding: "1%", borderRadius: "9px", cursor: "pointer", height: vh? "100%": "90%", background: "#F4E0C7",}}>
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                {
                    isDragActive ?
                    ( <Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center",
                        marginTop: {xs: "20%", sm: "35%"},
                        background: "#e2e2e2",
                        
                        
                    }}>
                        {location && <Typography textAlign="center" fontSize="1.1rem" sx={{padding: "2%", textTransform: "capitalize"}}>{location}</Typography>}
                        <AttachFileIcon/>
                        <Typography>Drop Files Here</Typography>
                        <Typography sx={{fontSize: ".7rem"}}>Or Click To Select File</Typography>
                    </Box>): image? <Box sx={{padding: "1%", height: "100%"}}>
                        <Image src={image} alt={location} width={200} height={200} style={{width: "100%", height: "auto"}}/>
                    </Box>
                        
                    :
                    (<Box sx={{display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center",
                        marginTop: {xs: "25%", sm: "35%", md: "20%"},
                    }}>
                        {location && <Typography textAlign="center" fontSize="1.1rem" sx={{padding: "2%", textTransform: "capitalize"}}>{location}</Typography>}
                        <AttachFileIcon/>
                        <Typography sx={{fontSize: ".7rem"}}>Drop New</Typography>
                        <Typography>Image</Typography>
                        <Typography sx={{fontSize: ".7rem"}}>Or Click To Select File</Typography>
                    </Box>)
                }
            </div>
        </Card>
    )
}