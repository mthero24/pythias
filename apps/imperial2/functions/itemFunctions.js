export const isSingleItem = (item)=>{
    console.log(item.order.items.filter(i=> !i.canceled && !i.shipped).length, "isSingle")
    if(item.order.items.filter(i=> !i.canceled && !i.shipped).length > 1) return false
    else return true
}
export const isShipped = async (item)=>{
    console.log(item.order.items.filter(i=> !i.canceled && !i.shipped).length == 0, "isShipped")
    //console.log(tem.order.items.filter(i=> !i.canceled && !i.shipped).length == 0)
    if(item.order.items.filter(i=> !i.canceled && !i.shipped).length == 0){
        console.log("return true")
        return true
    }else return false
}
export const canceled = (item, order)=>{
    if(item.canceled == true || order.canceled == true) return true
    else return false
}