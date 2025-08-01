import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products} from "@pythias/mongo"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    // let prods = await Products.find({ sku: { $ne: "21577M_F"}}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.color variantsArray.blank").populate({ path: "blanks", populate: "colors" })
    
    // for(let p of prods){
    //     if(!p.department) p.department = [];
    //     if(!p.category) p.category = [];
    //     for(let b of p.blanks){
    //         if(b.department && !p.department.includes(b.department)) p.department.push(b.department);
    //         for(let c of b.category){
    //             if(!p.category.includes(c)) p.category.push(c);
    //         }
    //     }
    //     await p.save()
    // }

    return <h1>test</h1>
}