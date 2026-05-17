"use client";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {useDropzone} from 'react-dropzone';
import {useCallback} from "react";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Image from "next/image";
import {Typography, Box} from "@mui/material";

const s3 = new S3Client({
    credentials: {
        accessKeyId: 'XWHXU4FP7MT2V842ITN9',
        secretAccessKey: 'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3',
    },
    region: "us-west-1",
    profile: "wasabi",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

export function Uploader({ afterFunction, location, image, productImage, primary, bl, color, vh, threadColor, setLoading, setOpen }) {
    const onDrop = useCallback(acceptedFiles => {
        for (let file of acceptedFiles) readFile(file);
    }, []);

    const readFile = async (file) => {
        setLoading && setLoading(true);
        setOpen && setOpen(false);
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function () {
            const ext = file.name.split(".").pop();
            const key = productImage
                ? `products/${Date.now()}.${ext}`
                : `designs/${Date.now()}.${ext}`;
            await s3.send(new PutObjectCommand({
                Bucket: "images1.pythiastechnologies.com",
                Key: key,
                Body: reader.result,
                ACL: "public-read",
                ContentEncoding: "base64",
                ContentDisposition: "inline",
                ContentType: file.type,
            }));
            afterFunction({ url: `https://images1.pythiastechnologies.com/${key}`, location, primary, bl, color, threadColor });
        };
        reader.onerror = (err) => console.error("File read error:", err);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png':  ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'text/emb':   ['.emb'],
            'text/dst':   ['.dst'],
            'text/exp':   ['.exp'],
            'text/pes':   ['.pes'],
            'text/ess':   ['.ess'],
            'text/esl':   ['.esl'],
        },
    });

    return (
        <Box
            {...getRootProps()}
            sx={{
                width: "100%",
                minHeight: 120,
                border: isDragActive ? "2px solid #1989df" : "2px dashed #c5d2db",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backgroundColor: isDragActive ? "#eef5ff" : "#fafbfc",
                transition: "border-color 0.18s, background-color 0.18s",
                p: 1.5,
                overflow: "hidden",
                position: "relative",
                "&:hover": {
                    borderColor: "#1989df",
                    backgroundColor: "#f4f8ff",
                },
            }}
        >
            <input {...getInputProps()} />
            {image ? (
                <Box sx={{ width: "100%", position: "relative" }}>
                    <Image
                        src={image}
                        alt={location || "upload preview"}
                        width={200}
                        height={200}
                        style={{ width: "100%", height: "auto", borderRadius: "6px", display: "block" }}
                    />
                    <Box
                        sx={{
                            position: "absolute", inset: 0,
                            backgroundColor: "rgba(0,0,0,0)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "6px",
                            transition: "background-color 0.2s",
                            "& .replace-hint": { opacity: 0, transition: "opacity 0.2s" },
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.45)" },
                            "&:hover .replace-hint": { opacity: 1 },
                        }}
                    >
                        <Box className="replace-hint" sx={{ textAlign: "center", color: "#fff" }}>
                            <CloudUploadIcon sx={{ fontSize: 26, mb: 0.25 }} />
                            <Typography variant="caption" display="block" fontWeight={600}>Replace</Typography>
                        </Box>
                    </Box>
                </Box>
            ) : isDragActive ? (
                <>
                    <CloudUploadIcon sx={{ fontSize: 34, color: "#1989df", mb: 0.75 }} />
                    {location && (
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: "capitalize", color: "#1989df", mb: 0.25 }}>
                            {location}
                        </Typography>
                    )}
                    <Typography variant="body2" color="primary" fontWeight={600}>Drop to upload</Typography>
                </>
            ) : (
                <>
                    <CloudUploadIcon sx={{ fontSize: 34, color: "#90a4ae", mb: 0.75 }} />
                    {location && (
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: "capitalize", color: "text.secondary", mb: 0.25 }}>
                            {location}
                        </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>Drop file here</Typography>
                    <Typography variant="caption" color="text.disabled">or click to browse</Typography>
                </>
            )}
        </Box>
    );
}
