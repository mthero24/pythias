import {Box, Typography, Card, TextField, Grid2, Button} from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import {useState, useEffect} from "react"
import axios from "axios"
export function Actions({bin, item, order, style, action, setAction}){
    console.log(style)
    const [weight, setWeight] = useState(0)
    const [rates, setRates] = useState({})
    useEffect(()=>{
        const getRates = async (type) =>{
            let res = await axios.get("/api/shipping/rates", {type})
        }
        if(action){
            //getRates()
        }
    }, [action])
    //To Do pull in weight
    return(
        <Grid2 size={{xs: 12}}>
            <Card sx={{height: {xs: `${style.height.xs *.7}px`, sm: `${style.height.xs *.5}px`, md: `${style.height.xs *.62}px`}, marginBottom: "1%"}}>
                {action.includes("bin") && (
                    <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", padding: "1%"}}>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                            <Image src={item?.sku.includes("gift")? item?.design?.front.replace("https//:", "https://"): createImage(item?.colorName, item?.styleCode, {url: item?.design.front})}
                            alt={item?.pieceId}
                            width={300}
                            height={300}
                            />
                        </Box>
                        <Typography fontSize="2rem" textAlign={"center"}>Place Item In Bin: </Typography>
                        <Typography fontSize="2.5rem" textAlign={"center"}>{bin.number}</Typography>
                        {action == "bin/ship" && (
                            <Button onClick={()=>{setAction("ship")}} sx={{background: "#0079DC", color: "#ffffff"}}>Order is ready to Ship. Do you want to ship it now?</Button>
                        )}
                    </Box>
                )}
                {action == "ship" && (
                    <Grid2 container spacing={2} sx={{padding: "2%"}}>
                        <Grid2 size={{xs: 12, sm: 6}} >
                            <Box>
                                <Typography>Weight: {weight}</Typography>
                                <Button>Ship</Button>
                            </Box>
                        </Grid2>
                        <Grid2 size={{xs: 12, sm: 6}} >
                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
                                <Box>
                                    <Typography>USPS First Class Cost: ${order.shippingRates.firstClassRate}</Typography>
                                    <Typography>USPS Priority Cost: ${order.shippingRates.priorityRate}</Typography>
                                    <Typography>FedEx Smart Post Cost: ${order.shippingRates.smartPostRate}</Typography>
                                    <Typography>FedEx Ground Cost: ${order.shippingRates.FedExGroundRate}</Typography>
                                    <Typography>FedEx Home Cost: ${order.shippingRates.FedExHomeRate}</Typography>
                                    <Typography>FedEx One Rate Cost: ${order.shippingRates.FedExOneRate}</Typography>
                                    <Typography>FedEx One Rate Next Day Cost: ${order.shippingRates.FedExOneRateNextDay}</Typography>
                                    <Typography>FedEx 2nd Day Cost: ${order.shippingRates.FedEx2ndDay}</Typography>
                                    <Typography>FedEx Next Day Cost: ${order.shippingRates.FedExNextDay}</Typography>
                                </Box>
                            </Box>
                        </Grid2>
                    </Grid2>
                )}
            </Card>
        </Grid2>
    )
}