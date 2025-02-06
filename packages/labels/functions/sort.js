
export function Sort(list){
    return list.sort((a,b)=>{
        if (a.shippingType.toUpperCase() > b.shippingType.toUpperCase()) return 1;
        if (a.shippingType.toUpperCase() < b.shippingType.toUpperCase()) return -1;
        if (a.vendor?.toUpperCase() > b.vendor?.toUpperCase()) return 1;
        if (a.vendor?.toUpperCase() < b.vendor?.toUpperCase()) return -1;
        if(a.styleCode.toUpperCase() > b.styleCode.toUpperCase()) return 1
        if(a.styleCode.toUpperCase() < b.styleCode.toUpperCase()) return -1
        if(a.colorName.toUpperCase() > b.colorName.toUpperCase()) return 1
        if(a.colorName.toUpperCase()< b.colorName.toUpperCase()) return -1
        if(a.sizeName.toUpperCase() > b.sizeName.toUpperCase()) return 1
        if(a.sizeName.toUpperCase() < b.sizeName.toUpperCase()) return -1
        return 0  
    })
}