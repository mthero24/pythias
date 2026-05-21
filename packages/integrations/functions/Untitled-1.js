

let getFields = ({defaultValues, marketplaceOverRides})=>{
    let fields = {}
    let defaultFields = Object.keys(defaultValues).filter(key => key.includes("field"))
    let marketplaceFields = Object.keys(marketplaceOverRides).filter(key => key.includes("field"))
    defaultFields.map(key => {
        fields[key.split(".")[1]] = defaultValues[key]
    })
    marketplaceFields.map(key => {
        console.log(`${key.split(".")[1].split("_")[0]}: ${marketplaceOverRides[key]}`)
        fields[key.split(".")[1]] = marketplaceOverRides[key]
    })
    return fields
}
const buildAcendaCatalogItems = (product, mp) => {
let acendaVariant = {
    Name: `${product.title} - ${variant.size.Name} ${variant.color.Name}`,
    sku: variant.sku,
    options: [],
    group: "variant",
    upc: variant.upc,
    gtin: variant.gtin,
    pricing_item:{
        msrp: {
            amount: variant.price,
        },
        price: {
            amount: variant.price,
        }
    },
    group_skus: [product.sku],
    fields: getFields({defaultValues: variant.defaultValues, marketplaceOverRides: product.blanks[0].marketplaceOverRides}),
    images: {
        default: {
            main:{
                url: variant.image.replace("width=400", "width=2400")
            },
            alternate: variant.images.map(img => ({ url: img.src.replace("width=400", "width=2400") })),
        }
    },
    quantity: 1000,
    id: variant.ids.acenda,
}
let acendaProduct = {
    Name: `${product.title}`,
    sku: product.sku,
    options: ["size", "color"],
    group: "product",
    upc: "",
    gtin: "",
    fields: getFields({ defaultValues: mp.defaultValues, marketplaceOverRides: product.blanks[0].marketplaceOverRides }),
    images: {
        default: {
            main: {
                url: variant.image
            },
            alternate: variant.images.map(img => ({ url: img.src })),
        }
    },
    id: product.ids.acenda,
}
}