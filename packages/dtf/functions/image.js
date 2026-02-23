"use client";
export const createImage = (colorName, styleCode, options, width=700, source) => {
    let side = 'garment';
    if(options.side){
        side = options.side;
    }
    console.log(side)
    console.log(colorName, styleCode, options, width, source, "createImage params")
    if(!colorName) return ''
    let url;
    if(source == "IM") {
        url = `https://imperial.pythiastechnologies.com/api/renderImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.jpg?blank=${styleCode}&colorName=${colorName}&design=${options.url}${options.printArea ? `&side=${options.printArea}` : ""}&width=${width}`;
        
    } else if (source == "PP") {
        url = `https://simplysage.pythiastechnologies.com/api/renderImages/${options.sku ? options.sku : "SKU"}-${styleCode.toLowerCase()}-${colorName.toLowerCase()}-${side}.jpg?blank=${styleCode}&colorName=${colorName}&design=${options.url}${options.printArea ? `&side=${options.printArea}` : ""}&width=${width}`;

    } else{
        if (options.url) {
            url = `https://images4.teeshirtpalace.com/images/productImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?url=${options.url.replace(
                "https://s3.wasabisys.com/images2.tshirtpalace.com/",
                "https://images2.teeshirtpalace.com/"
            )}&width=${width}${options.printArea ? `&printArea=${options.printArea}` : ""}`;
        }
        if (options.sku) {
            url = `https://images4.teeshirtpalace.com/images/productImages/${options.sku}--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?width=${width}${options.printArea ? `&printArea=${options.printArea}` : ""}`;
        }
    }
   console.log(url, 'url')
   //console.log(url)
    return url;
};