"use client";
import {Box, Modal, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
export function Items({order, style}){
    let headingStyle = {
        textAlign: "center",
         fontWeight:600
    }
    let iconBoxStyle = {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center"
    }
    return (
        <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
            <Card
                sx={{ height: style.height * 0.41, maxHeight: style.height * 0.41, overflow: "auto", margin: "1%" }}
            >
            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">Order Items</Typography>
            {order.items.filter(i=> !i.canceled && !i.shipped).map((it, i) => (
                <Card
                key={i}
                sx={{
                    background: i % 2 == 0 ? "#e2e2e2" : "#f2f2f2",
                    padding: ".5%",
                    margin: ".7%",
                }}
                >
                    <Grid2 container spacing={1}>
                        <Grid2 size={{xs: 5}}>
                            {it.design &&
                            <Image
                                src={it.sku.includes("gift")? it.design?.front.replace("https//:", "https://"): createImage(it.colorName, it.styleCode, {url: it.design?.front})}
                                alt={it.pieceId}
                                width={100}
                                height={100}
                            />
                        }
                        </Grid2>
                        <Grid2 size={{xs: 7}}>
                            <Grid2 container spacing={1}>
                                <Grid2 size={{xs: 12}}>
                                    <Typography  sx={{fontWeight: 600, fontSize: ".9rem", textTransform: "capitalize"}}>PieceID: {it.pieceId}, blank: {it.styleCode}</Typography>
                                    <Typography  sx={{fontSize: ".7rem", textTransform: "capitalize"}}> Color: {it.colorName}, Size: {it.sizeName}</Typography>
                                </Grid2>
                                <Grid2 size={{xs: 6, sm: 3}}>
                                    <Typography sx={headingStyle}>Treated</Typography>
                                    <Box sx={iconBoxStyle}>
                                        {it.treated? <CheckIcon sx={{color: "green"}} />: <CloseIcon sx={{color: "red"}} />}
                                    </Box>
                                </Grid2>
                                <Grid2 size={{xs: 6, sm: 3}}>
                                    <Typography sx={headingStyle}>Printed</Typography>
                                    <Box sx={iconBoxStyle}>
                                        {it.printed? <CheckIcon sx={{color: "green"}} />: <CloseIcon sx={{color: "red"}} />}
                                    </Box>
                                </Grid2>
                                <Grid2 size={{xs: 6, sm: 3}}>
                                    <Typography sx={headingStyle}>Folded</Typography>
                                    <Box sx={iconBoxStyle}>
                                        {it.folded? <CheckIcon sx={{color: "green"}} />: <CloseIcon sx={{color: "red"}} />}
                                    </Box>
                                </Grid2>
                                <Grid2 size={{xs: 6, sm: 3}}>
                                    <Typography sx={headingStyle} >In Bin</Typography>
                                    <Box sx={iconBoxStyle}>
                                        {it.inBin? <CheckIcon sx={{color: "green"}} />: <CloseIcon sx={{color: "red"}} />}
                                    </Box>
                        </Grid2>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </Card>
            ))}
            </Card>
        </Grid2>
    )
}