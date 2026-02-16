import {Box, Grid, Typography, Card, Button} from "@mui/material"
import Image from "next/image"
import * as multiple from "./images/multipleSizesBags.jpg"
import * as boxes from "./images/boxes.webp"
import * as fedexen from "./images/fedexen.jpg"
import * as fedexpak from "./images/fedexpak.jpg"
import {useState} from "react"
export function Standard ({blank, setBlank, save, dimensions, setDimensions}){
    console.log(dimensions, "dimensions")
    const [selected, setSelected] = useState(blank.singleShippingDimensions?.name)
    const [packageSelected, setPackageSelected] = useState(blank.singleShippingDimensions?.packageType)
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
        <Grid container spacing={2}>
            {!packageSelected && Object.keys(packaging).map((k,i)=>(
                <Grid item xs={12} sm={6} key={i}>
                    <Card sx={{cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{setPackageSelected(k)}}>
                        <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                            <Image src={packaging[k].image} alt={k} width={200} height={200}/>
                        </Box>
                        
                    </Card>
                </Grid>
            ))}
            {packageSelected && Object.keys(packaging[packageSelected]).map((k,i)=>(
                <Grid key={i} item xs={6} sm={12 / 5} sx={{display: k == "image"? "none": "block"}} >
                    {k != "image" && (
                        <Card sx={{border: selected == k? "1px solid #db1a1aff": "none",cursor: "pointer", "&:hover": {opacity: 0.6}}} onClick={()=>{
                            let b = {...blank}
                            b.singleShippingDimensions = {...packaging[packageSelected][k], name: k, packageType: packageSelected}
                            setBlank(b)
                            save(b)
                            setSelected(k);
                            setDimensions({...packaging[packageSelected][k], name: k, packageType: packageSelected});
                        }}>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{k}</Typography>
                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", padding: '2%'}}>
                                <Image src={packaging[packageSelected][k].image} alt={k} width={100} height={100}/>
                            </Box>
                            <Typography fontSize="1.4rem" fontWeight={600} textAlign="center">{`${packaging[packageSelected][k].width}x${packaging[packageSelected][k].length}x${packaging[packageSelected][k].height}`}</Typography>
                        </Card>
                    )}
                </Grid>
            ))}
            <Grid item xs={12}>
                <Button onClick={()=>{if(packageSelected) setPackageSelected()}}>Back</Button>
            </Grid>
        </Grid>
    )
}