
export function Sort(list){
    return list.sort((a,b)=>{
        if(a.type?.toUpperCase() > b.type?.toUpperCase()) return 1
        if(a.type?.toUpperCase() < b.type?.toUpperCase()) return -1
        if(parseInt(a.inventory?.row? a.inventory?.row: 0) > parseInt(b.inventory?.row? b.inventory?.row: 0)) return 1
        if(parseInt(a.inventory?.row? a.inventory?.row: 0) < parseInt(b.inventory?.row? b.inventory?.row: 0)) return -1
        if(a.inventory?.unit?.toUpperCase() > b.inventory?.unit?.toUpperCase()) return 1
        if(a.inventory?.unit?.toUpperCase() < b.inventory?.unit?.toUpperCase()) return -1
        if(parseInt(a.inventory?.row? a.inventory?.shelf: 0) >  parseInt(b.inventory?.shelf? b.inventory?.shelf: 0)) return 1
        if(parseInt(a.inventory?.row? a.inventory?.shelf: 0) <  parseInt(b.inventory?.shelf? b.inventory?.shelf: 0)) return -1
        if(a.inventory?.bin?.toUpperCase() > b.inventory?.bin?.toUpperCase()) return 1
        if(a.inventory?.bin?.toUpperCase() < b.inventory?.bin?.toUpperCase()) return -1
        if (a.shippingType?.toUpperCase() > b.shippingType?.toUpperCase()) return 1;
        if (a.shippingType?.toUpperCase() < b.shippingType?.toUpperCase()) return -1;
        if (a.vendor?.toUpperCase() > b.vendor?.toUpperCase()) return 1;
        if (a.vendor?.toUpperCase() < b.vendor?.toUpperCase()) return -1;
        if(a.styleCode?.toUpperCase() > b.styleCode?.toUpperCase()) return 1
        if(a.styleCode?.toUpperCase() < b.styleCode?.toUpperCase()) return -1
        if(a.colorName?.toUpperCase() > b.colorName?.toUpperCase()) return 1
        if(a.colorName?.toUpperCase()< b.colorName?.toUpperCase()) return -1
        if(a.sizeName?.toUpperCase() > b.sizeName?.toUpperCase()) return 1
        if(a.sizeName?.toUpperCase() < b.sizeName?.toUpperCase()) return -1
        return 0  
    })
}