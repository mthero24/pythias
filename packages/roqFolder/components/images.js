import {Box, Card} from "@mui/material";
import {createImage} from "../functions/image";
import Image from "next/image";
export function Images({item, source}){
    return (
        <Box sx={{margin: "1%",  padding: "1%", display: "flex", flexDirection: "row", justifyContent: 'center'}}>
            {item?.design?.front &&  <Image
                src={item.sku.includes("gift")? item.design?.front.replace("https//:", "https://"): createImage(item.colorName, item.styleCode, {url: item.design.front}, source)}
                alt={item.pieceId}
                width={500}
                height={500}
                style={{maxWidth: typeof window !== "undefined"? window.innerWidth * .5: "500px", height: 'auto'}}
            />}
            {item?.design?.back &&  <Image
                src={item.sku.includes("gift")? item.design?.front.replace("https//:", "https://"): createImage(item.colorName, item.styleCode, {url: item.design.back}, source)}
                alt={item.pieceId}
                width={500}
                height={500}
                style={{maxWidth: typeof window !== "undefined"? window.innerWidth * .5: "500px", height: 'auto'}}
            />}
        </Box>
    )
}