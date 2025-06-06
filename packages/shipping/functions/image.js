"use client";
export const createImage = (colorName, styleCode, options, source, width=700) => {
    console.log(source)
    let url;
    if(source != "PP" || source == "IM"){
        let side = 'garment';
        if(options.side){
            side = options.side;
        }
        console.log(side)
        console.log(colorName, styleCode, options, width)
        if(!colorName) return ''
        if(options.url){
            url = `https://images4.teeshirtpalace.com/images/productImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?url=${options.url}&width=${width}`;
        }
        if(options.sku){
            url = `https://images4.teeshirtpalace.com/images/productImages/${options.sku}--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?width=${width}`;
        }
        console.log(url, 'url')
        //console.log(url)
    }else if(source == "PP"){
        url = `https://simplysage.pythiastechnologies.com/api/renderImages?colorName=${colorName}&blank=${styleCode}&design=${options.url}&side=${options.side? options.side: "front"}`
    } else if(source == "IM"){
        url = `https://imperial.pythiastechnologies.com/api/renderImages?colorName=${colorName}&blank=${styleCode}&design=${options.url}&side=${options.side? options.side: "front"}`
    }    
    return url;
};