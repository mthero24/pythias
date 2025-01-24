import {Box, Typography, Card, TextField, Grid2, Button, FormControlLabel, Checkbox} from "@mui/material";
import Image from "next/image"
import { createImage } from "../../functions/image";
import * as multiple from "../../images/multipleSizesBags.jpg"
import * as boxes from "../../images/boxes.webp"
import {useState} from "react"
export function Actions({bin, item, order, style, action, setAction, shippingPrices, setShippingPrices, timer, weight,setGetWeight, getWeight, dimensions, setDimensions}){
    //console.log(style)
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
                {action == "ship" &&  (
                    <Grid2 container spacing={2} sx={{padding: "2%"}}>
                        <Grid2 size={12}>
                            <Typography fontSize="1.5rem" fontWeight={600} textAlign={"center"}>Shipping Type: {order.shippingType}</Typography>
                        </Grid2>
                        {timer > 0 && (
                            <Grid2 size={12} sx={{paddingTop: "10%"}}>
                                <Typography fontSize="3.0rem" fontWeight={600} textAlign={"center"}>Getting Weight In: {timer}</Typography>
                                <Typography fontSize="1.5rem" fontWeight={600} textAlign={"center"}>Ensure the scale is on and order is on the scale!</Typography>
                            </Grid2>
                        )}
                        {timer == 0 && weight > 0 &&  (
                            <Grid2 size={12} >
                            <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                <Typography fontSize="2.5rem" fontWeight={600} textAlign={"center"}>Weight: {weight} oz</Typography>
                                
                                {!dimensions && order.shippingType == "Standard" && (
                                    <Standard dimensions={dimensions} setDimensions={setDimensions} />
                                )}
                                {dimensions && (<Box sx={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                                    <Box sx={{...row }}>
                                        <Image src={dimensions.image} width={300} height={300} alt="package image"/>
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
                        <Grid2 size={12} >
                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                                <Box>
                                   {shippingPrices && shippingPrices.sort((a,b)=>{
                                    if(a.rate < b.rate) return -1
                                    if(a.rate > b.rate) return 1
                                    else return 0
                                   }).map((p, i)=>(
                                        <FormControlLabel control={<Checkbox defaultChecked={i == 0? true: false} value={p.label} />} label={`${p.label} - ${p.rate}`} key={i}/>
                                   ))}
                                </Box>
                            </Box>
                        </Grid2>
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
                height: .5
            },
            medium: {
                image: multiple,
                width: 10,
                length: 13,
                height: 1
            },
            large: {
                image: multiple,
                width: 14.5,
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