import {Box, Typography, Card, TextField, Grid2, Button, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio } from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import * as multiple from "../../images/multipleSizesBags.jpg"
import * as boxes from "../../images/boxes.webp"
import * as fedexen from "../../images/fedexen.jpg"
import * as fedexpak from "../../images/fedexpak.jpg"
import {useState, useEffect} from "react"
import axios from "axios"
export function Actions({bin, setBins, item, order, style, action, setAction, shippingPrices, setShippingPrices, timer, weight,setGetWeight, getWeight, dimensions, setDimensions, close, station, closeTimer, setCloseTimer, setStopClose, stopClose, label, setLabel}){
    //console.log(style)
    const [shippingSelected, setShippingSelected] = useState({name: "GroundAdvantage"})
    const [ignoreBadAddress, setIgnoreBadAddress] = useState(false)
    useEffect(()=>{
        if(shippingPrices){
            let res = shippingPrices.sort((a,b)=>{
                if(a.rate < b.rate) return -1
                if(a.rate > b.rate) return 1
                else return 0
            })[0].service
            console.log(res)
            setShippingSelected(res)
        }
    },[shippingPrices])
    
    const selectShipping = ()=>{
        console.log(event.target.value)
        setShippingSelected(shippingPrices?.filter(s=> s.service.name == event.target.value)[0].service)
    }
    const ship = async ()=>{
        let res = await axios.post("/api/production/shipping/labels", {address: order.shippingAddress, poNumber: order.poNumber, orderId: order._id, selectedShipping: shippingSelected, dimensions, weight, shippingType: order.shippingType, station, ignoreBadAddress, marketplace: order.marketplace})
        console.log(res.data)
        if(res.data.error){
            alert(res.data.msg)
        }else{
            console.log("+++++++++++++++++++++++")
            setLabel(res.data.label)
            setBins(res.data.bins)
            setShippingPrices()
        }
    }
    const reprint = async (label)=>{
        let res = await axios.post("/api/production/shipping/labels/reprint", {label, station})
        if(res.data.error){
            alert(res.data.msg)
        }else{
            setLabel(res.data.label)
        }
    }
    const reprintLabel = async () =>{
        setStopClose(true)
        reprint(label)
        setLabel()
    }
    let row={
        display: "flex",
        flexDirection: 'row',
        justifyContent: "center"
    }
    const updateDimensions = (label)=>{
        setShippingPrices()
        let di = {...dimensions}
        console.log(event.target)
        di[label] = event.target.value
        setDimensions({...di})
    }
    return(
        <Grid2 size={{xs: 12}}>
            <Card sx={{ marginBottom: "1%"}}>
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
                {action == "ship" &&  (
                    <Grid2 container spacing={2} sx={{padding: "2%"}}>
                        <Grid2 size={12}>
                            <Typography fontSize={{xs: "1rem", sm:"1.5rem"}} fontWeight={600} textAlign={"center"}>Shipping Type: {order.shippingType}</Typography>
                        </Grid2>
                        {timer > 0 && !closeTimer &&  (
                            <Grid2 size={12} sx={{paddingTop: "10%"}}>
                                <Typography fontSize="3.0rem" fontWeight={600} textAlign={"center"}>Getting Weight In: {timer}</Typography>
                                <Typography fontSize="1.5rem" fontWeight={600} textAlign={"center"}>Ensure the scale is on and order is on the scale!</Typography>
                            </Grid2>
                        )}
                        {timer == 0 && weight > 0  && (
                            <Grid2 size={12} >
                            <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                <Typography fontSize={{xs: "1.5rem", sm:"2.0rem"}} fontWeight={600} textAlign={"center"}>Weight: {weight} oz</Typography>
                                
                                {!dimensions && (order.shippingType == "Standard" || order.shippingType == "Expedited") && (
                                    <Standard dimensions={dimensions} setDimensions={setDimensions} />
                                )}
                                 {!dimensions && (order.shippingType != "Standard" && order.shippingType != "Expedited") && (
                                    <Expedited dimensions={dimensions} setDimensions={setDimensions} />
                                )}
                                {dimensions && (<Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <Box sx={{...row }}>
                                        <Image src={dimensions.image} width={200} height={200} alt="package image" />
                                    </Box>
                                    <Box sx={{...row, padding:"1%" }}>
                                        <TextField type="number" sx={{margin: ".5%"}} value={dimensions? dimensions.width: 0} label="Width" onChange={()=>{updateDimensions("width")}}/>
                                        <TextField type="number" sx={{margin: ".5%"}} value={dimensions? dimensions.length: 0} label="Length" onChange={()=>{updateDimensions("length")}}/>
                                        <TextField type="number" sx={{margin: ".5%"}} value={dimensions? dimensions.height: 0} label="Height" onChange={()=>{updateDimensions("height")}}/>
                                    </Box>
                                </Box>)}
                            </Box>
                        </Grid2>
                        )}
                        {timer == 0 && weight == 0 && (
                            <Grid2 size={12} >
                                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <Box sx={{display:"flex", flexDirection: "row", justifyContent: "center"}}>
                                        <Button onClick={()=>{setGetWeight(!getWeight)}} sx={{background: "#0079DC", color: "#ffffff", width: "50%"}}>Weigh Again</Button>
                                    </Box>
                                </Box>
                            </Grid2>
                        )}
                        {shippingPrices && (
                            <Grid2 size={12} >
                                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                                    <Box>
                                        <FormControl>
                                            <FormLabel id="demo-row-radio-buttons-group-label" sx={{textAlign: "center", fontSize: "1.3rem"}}>Shipping Rates</FormLabel>
                                            <RadioGroup
                                                row
                                                aria-labelledby="demo-row-radio-buttons-group-label"
                                                name="row-radio-buttons-group"
                                                value={shippingSelected.name}
                                                onChange={selectShipping}
                                            >
                                                {shippingPrices && shippingPrices.sort((a,b)=>{
                                                    if(a.rate < b.rate) return -1
                                                    if(a.rate > b.rate) return 1
                                                    else return 0
                                                }).map((p, i)=>(
                                                        <FormControlLabel value={p.service.name} control={<Radio value={p.service.name} />} label={`${p.label} - ${p.rate}`} key={i}/>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <Grid2 container spacing={2}>
                                            <Grid2 size={11}>
                                                <Button onClick={ship} fullWidth sx={{color: "#ffffff", background: "#0079DC", marginTop: ".5%"}}>Ship</Button>
                                            </Grid2>
                                            <Grid2 size={1}>
                                                <FormControlLabel control={<Checkbox checked={ignoreBadAddress} onChange={()=>{setIgnoreBadAddress(!ignoreBadAddress); console.log(!ignoreBadAddress)}} />} label="Ignore" />
                                            </Grid2>
                                        </Grid2>
                                    </Box>
                                </Box>
                            </Grid2>
                        )}
                        {timer > 0 && closeTimer && dimensions &&  (
                            <Grid2 size={12} sx={{paddingTop: "10%"}}>
                                 <Box sx={{...row }}>
                                    <Image src={dimensions.image} width={200} height={200} alt="package image" />
                                </Box>
                                <Typography fontSize="3.0rem" fontWeight={600} textAlign={"center"}>Closing In: {timer}</Typography>
                                <Button fullWidth sx={{color: "#ffffff", background: "#0079DC", marginTop: ".5%"}} onClick={reprintLabel}>Reprint Label</Button>
                            </Grid2>
                        )}
                    </Grid2>
                )}
            </Card>
        </Grid2>
    )
}

const Standard = ({setDimensions})=>{
    const [packageSelected, setPackageSelected] = useState()
    let packaging = {
        Mailer: {
            image: multiple,
            small: {
                image: multiple,
                width: 5,
                length: 6,
                height: 1
            },
            medium: {
                image: multiple,
                width: 10,
                length: 13,
                height: 1
            },
            large: {
                image: multiple,
                width: 14,
                length: 19,
                height: 2
            },
            extra_large: {
                image: multiple,
                width: 19,
                length: 24,
                height: 4
            },
            set_your_own: {
                image: multiple,
                width: 0,
                length: 0,
                height: 0
            },
        },
        Box: {
            image: boxes,
            small: {
                image: boxes,
                width: 7,
                length: 7,
                height: 4
            },
            medium: {
                image: boxes,
                width: 8,
                length: 8,
                height: 4
            },
            large: {
                image: boxes,
                width: 10,
                length: 10,
                height: 6
            },
            extra_large: {
                image: boxes,
                width: 6,
                length: 12,
                height: 6
            },
            set_your_own: {
                image: boxes,
                width: 0,
                length: 0,
                height: 0
            },
        }
    }
    return (
        <Grid2 container spacing={2}>
            {!packageSelected && Object.keys(packaging).map((k,i)=>(
                <Grid2 size={{xs: 12, sm: 6}} key={i}>
                    <Card sx={{cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{setPackageSelected(k)}}>
                        <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                            <Image src={packaging[k].image} alt={k} width={200} height={200}/>
                        </Box>
                        
                    </Card>
                </Grid2>
            ))}
            {packageSelected && Object.keys(packaging[packageSelected]).map((k,i)=>(
                <Grid2 size={{xs: 6, sm: 12 / 5 }} sx={{display: k == "image"? "none": "block"}} >
                    {k != "image" && (
                        <Card sx={{cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{setDimensions(packaging[packageSelected][k])}}>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                                <Image src={packaging[packageSelected][k].image} alt={k} width={100} height={100}/>
                            </Box>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{`${packaging[packageSelected][k].width}x${packaging[packageSelected][k].length}x${packaging[packageSelected][k].height}`}</Typography>
                        </Card>
                    )}
                </Grid2>
            ))}
            <Grid2 size={12}>
                <Button onClick={()=>{if(packageSelected) setPackageSelected()}}>Back</Button>
            </Grid2>
        </Grid2>
    )
}

const Expedited = ({setDimensions})=>{
    const [packageSelected, setPackageSelected] = useState()
    const [oneRate, setOneRate] = useState()
    let OneRate = {
        Envelope: {
            image: fedexen,
        },
        Pak: {
            image: fedexpak,
        }
    }
    let packaging = {
        Envelope: {
            image: fedexen,
            oneRate: {
                image: fedexen,
                width: 9,
                length: 15,
                height: 1,
                packaging: "FEDEX_ENVELOPE"
            }
        },
        Pak: {
            image: fedexpak,
            oneRate: {
                image: fedexpak,
                width: 12,
                length: 16,
                height: 3,
                packaging: "FEDEX_PAK"
            }
        },
        Mailer: {
            image: multiple,
            small: {
                image: multiple,
                width: 5,
                length: 6,
                height: 1,
                packaging: "YOUR_PACKAGING"
                
            },
            medium: {
                image: multiple,
                width: 10,
                length: 13,
                height: 1,
                packaging: "YOUR_PACKAGING"
            },
            large: {
                image: multiple,
                width: 14.5,
                length: 19,
                height: 2,
                packaging: "YOUR_PACKAGING"
            },
            extra_large: {
                image: multiple,
                width: 19,
                length: 24,
                height: 4,
                packaging: "YOUR_PACKAGING"
            },
            set_your_own: {
                image: multiple,
                width: 0,
                length: 0,
                height: 0,
                packaging: "YOUR_PACKAGING"
            },
        },
        Box: {
            image: boxes,
            small: {
                image: boxes,
                width: 7,
                length: 7,
                height: 4,
                packaging: "YOUR_PACKAGING"
            },
            medium: {
                image: boxes,
                width: 8,
                length: 8,
                height: 4,
                packaging: "YOUR_PACKAGING"
            },
            large: {
                image: boxes,
                width: 10,
                length: 10,
                height: 6,
                packaging: "YOUR_PACKAGING"
            },
            extra_large: {
                image: boxes,
                width: 6,
                length: 12,
                height: 6,
                packaging: "YOUR_PACKAGING"
            },
            set_your_own: {
                image: boxes,
                width: 0,
                length: 0,
                height: 0,
                packaging: "YOUR_PACKAGING"
            },
        }
    }
    return (
        <Grid2 container spacing={2}>
            {!packageSelected && Object.keys(packaging).map((k,i)=>(
                <Grid2 size={{xs: 12, sm: 3}} key={i}>
                    <Card sx={{cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{setPackageSelected(k)}}>
                        <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                            <Image src={packaging[k].image} alt={k} width={200} height={200}/>
                        </Box>
                        
                    </Card>
                </Grid2>
            ))}
            {packageSelected && Object.keys(packaging[packageSelected]).map((k,i)=>(
                <Grid2 size={{xs: 6, sm: 12 / 5 }} sx={{display: k == "image"? "none": "block"}} >
                    {k != "image" && (
                        <Card sx={{cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{setDimensions(packaging[packageSelected][k])}}>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                                <Image src={packaging[packageSelected][k].image} alt={k} width={100} height={100}/>
                            </Box>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{`${packaging[packageSelected][k].width}x${packaging[packageSelected][k].length}x${packaging[packageSelected][k].height}`}</Typography>
                        </Card>
                    )}
                </Grid2>
            ))}
            <Grid2 size={12}>
                <Button onClick={()=>{if(packageSelected) setPackageSelected()}}>Back</Button>
            </Grid2>
        </Grid2>
    )
}