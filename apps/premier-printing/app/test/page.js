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
    let prods = await Products.find({}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.color variantsArray.blank").populate({ path: "blanks", populate: "colors" })
    let products = [];
    for (let product of prods) {
        let variantsArray = []
        if (product.threadColor && product.threadColors.length > 0) {
            for (let b of product.blanks) {
                for (let tc of product.threadColors) {
                    for (let c of product.colors) {
                        if (product.variant && product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                            let variants = product.variants[b.code][tc.name][c.name].map(v => {
                                v.color = v.color._id
                                v.blank = v.blank._id
                                v.size = v.size._id
                                v.images = v.images.map(i => i.image ? i.image : i)
                                return v;
                            })
                            variantsArray = [...variantsArray, ...variants];
                        }
                    }
                }
            }
        } else {
            for (let b of product.blanks) {
                for (let c of product.colors) {
                    if (product.variants && product.variants[b.code] && product.variants[b.code][c.name] && product.variants[b.code][c.name].length > 0) {
                        let variants = product.variants[b.code][c.name].map(v => {
                            console.log(v)
                            v.color = v.color._id
                            v.blank = v.blank._id
                            v.size = v.size._id
                            console.log(v.images)
                            v.images = v.images?.map(i => i.image? i.image: i)
                            return v;
                        })
                        variantsArray = [...variantsArray, ...variants];
                    }
                }
            }
        }
        if(variantsArray.length > 0) product.variantsArray = variantsArray
        if(variantsArray.length > 0){
            //product.variants = null
        }
        console.log(product.variantsArray)
        if (product._id) {
            product = await Products.findByIdAndUpdate(product._id, product, { new: true, returnNewDocument: true }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
        } else {
            product = await Products.create(product)
            product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
        }
        products.push(product);
    }

    return <h1>test</h1>
}