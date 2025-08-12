
export async function getInv({Blanks, Inventory, term, page} ){
    console.log(page, "page in getInv");
    let blanks, found = [], count;
    if(term){
        blanks = await Blanks.find({$or: [{code: term}, {name: term}, {department: term}]}).populate("colors").select("code name colors sizes department").collation({ locale: "en", strength: 2 }).skip((20 * page) - 20).limit(20)
        count = await Blanks.find({$or: [{code: term}, {name: term}, {department: term}]}).collation({ locale: "en", strength: 2 }).countDocuments()
        if(blanks.length == 0) {
            blanks = await Blanks.find({$or: [{code: {$regex: term, $options: "i"}}, {name: {$regex: term, $options: "i"}}, {department: {$regex: term, $options: "i"}}]}).populate("colors").limit(20)
            count = await Blanks.find({$or: [{code: {$regex: term, $options: "i"}}, {name: {$regex: term, $options: "i"}}, {department: {$regex: term, $options: "i"}}]}).countDocuments()
        }
    }else{
        blanks = await Blanks.find({}).populate("colors").skip((page * 20) - 20).select("code name colors sizes department").limit(20)
        count = await Blanks.find({}).countDocuments()
    }
    if(blanks){
        let inventory = await Inventory.find({style_code: {$in: blanks.map(b=> b.code)}, type: {$ne: "product"}}).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus").lean().catch(e=>{console.log(e)});
        // for(let i of inventory){
        //     if(i.pending_quantity < 0){
        //         i.quantity + i.pending_quantity
        //         i.pending_quantity = i.pending_quantity + (i.pending_quantity * -1)
        //         await i.save()
        //     }
        // }
        let combined = []
        for(let blank of blanks){
            blank.inventory = inventory.filter(i=> i.style_code == blank.code)
            combined.push({blank, inventories: blank.inventory})
        }
        found = [...combined]
    }
    count = Math.ceil(count/ 20)
    console.log(found.length, "combined length in getInv")
    return {error: false, blanks: found, count}
}