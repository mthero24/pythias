
export function Sort(list, source){
    return list.sort((a,b)=>{
        if(source == "PO"){
            if(a.shippingType?.toUpperCase() > b.shippingType?.toUpperCase()) return 1
            if(a.shippingType?.toUpperCase() < b.shippingType?.toUpperCase()) return -1
        }
        if(a.type?.toUpperCase() > b.type?.toUpperCase()) return 1
        if(a.type?.toUpperCase() < b.type?.toUpperCase()) return -1
        if(source == "IM"){
            if(a.designRef?.sku?.toUpperCase() > b.designRef?.sku?.toUpperCase()) return 1
            if(a.designRef?.sku?.toUpperCase()< b.designRef?.sku?.toUpperCase()) return -1
            if(a.threadColorName?.toUpperCase() > b.threadColorName?.toUpperCase()) return 1
            if(a.threadColorName?.toUpperCase()< b.threadColorName?.toUpperCase()) return -1
        } if (parseInt(a.inventory?.inventory?.row ? a.inventory?.inventory?.row : 0) > parseInt(b.inventory?.inventory?.row ? b.inventory?.inventory?.row : 0)) return 1
        if (parseInt(a.inventory?.inventory?.row ? a.inventory?.inventory?.row : 0) < parseInt(b.inventory?.inventory?.row ? b.inventory?.inventory?.row : 0)) return -1
        if (a.inventory?.inventory?.unit?.toUpperCase() > b.inventory?.inventory?.unit?.toUpperCase()) return 1
        if (a.inventory?.inventory?.unit?.toUpperCase() < b.inventory?.inventory?.unit?.toUpperCase()) return -1
        if (parseInt(a.inventory?.inventory?.shelf ? a.inventory?.inventory?.shelf : 0) > parseInt(b.inventory?.inventory?.shelf ? b.inventory?.inventory?.shelf : 0)) return 1
        if (parseInt(a.inventory?.inventory?.shelf ? a.inventory?.inventory?.shelf : 0) < parseInt(b.inventory?.inventory?.shelf ? b.inventory?.inventory?.shelf : 0)) return -1
        if(a.inventory?.productInventory?.location > b.inventory?.productInventory?.location) return 1
        if(a.inventory?.productInventory?.location < b.inventory?.productInventory?.location) return -1
        if (a.inventory?.bin?.toUpperCase() > b.inventory?.bin?.toUpperCase()) return 1
        if (a.inventory?.bin?.toUpperCase() < b.inventory?.bin?.toUpperCase()) return -1
        if (a.styleCode?.toUpperCase() > b.styleCode?.toUpperCase()) return 1
        if (a.styleCode?.toUpperCase() < b.styleCode?.toUpperCase()) return -1
        if (a.vendor?.toUpperCase() > b.vendor?.toUpperCase()) return 1;
        if (a.vendor?.toUpperCase() < b.vendor?.toUpperCase()) return -1;
        if(a.colorName?.toUpperCase() > b.colorName?.toUpperCase()) return 1
        if(a.colorName?.toUpperCase()< b.colorName?.toUpperCase()) return -1
        if(a.sizeName?.toUpperCase() > b.sizeName?.toUpperCase()) return 1
        if(a.sizeName?.toUpperCase() < b.sizeName?.toUpperCase()) return -1
        return 0  
    })
}