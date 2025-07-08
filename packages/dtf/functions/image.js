"use client";
export const createImage = (colorName, styleCode, options, width=700) => {
    let side = 'garment';
    if(options.side){
        side = options.side;
    }
    console.log(side)
    console.log(colorName, styleCode, options, width)
    if(!colorName) return ''
    let url;
    if(options.url){
        url = `https://images4.tshirtpalace.com/images/productImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?url=${options.url}&width=${width}${options.printArea? `&printArea=${options.printArea}`: ""}`;
    }
    if(options.sku){
        url = `https://images4.tshirtpalace.com/images/productImages/${options.sku}--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?width=${width}${options.printArea? `&printArea=${options.printArea}`: ""}`;
    }
   console.log(url, 'url')
   //console.log(url)
    return url;
};