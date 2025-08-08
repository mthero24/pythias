

export const saveProducts = async ({products, Products, Inventory}) => {
    let savedProducts = [];
    for(let product of products) {
        let variantsArray = []
        if(product.threadColors && product.threadColors.length > 0){
            for (let b of product.blanks) {
                for (let tc of product.threadColors) {
                    for (let c of product.colors) {
                        if (product.variants &&product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                            let variants = product.variants[b.code][tc.name][c.name].map( v => {
                                v.color = v.color._id
                                v.blank = v.blank._id
                                v.size = v.size._id
                                v.images = v.images?.map(i=> i.image)
                                return v;
                            })
                            variantsArray = [...variantsArray, ...variants];
                        }
                    }
                }
            }       
        }else{
            for (let b of product.blanks) {
                for (let c of product.colors) {
                    if (product.variants && product.variants[b.code] && product.variants[b.code][c.name] && product.variants[b.code][c.name].length > 0) {
                        let variants = product.variants[b.code][c.name].map( v=> {
                            v.color = c._id
                            v.blank = b._id
                            v.size = v.size._id
                            v.images = v.images?.map(i => i.image)
                            return v;
                        })
                        variantsArray = [...variantsArray, ...variants];
                    }
                }
            }    
        }
        if(variantsArray.length > 0) {
            product.variantsArray = variantsArray
        }
        for (let v of product.variantsArray) {
            v.inventory = await Inventory.findOne({ blank: v.blank._id ? v.blank._id : v.blank, color: v.color._id ? v.color._id : v.color, sizeId: v.size._id ? v.size._id : v.size });
        }
        product.variants = null; // Clear variants to avoid duplication
        product.lastUpdated = new Date(Date.now()); // Update lastUpdated field
        if(!product.department) product.department = [];
        if(!product.category) product.category = [];
        for(let b of product.blanks){
            if(b.department && !product.department.includes(b.department)) product.department.push(b.department);
            for(let c of b.category? b.category : []){
                if(!product.category.includes(c)) product.category.push(c);
            }
        }
        if(product._id) {
            product = await Products.findByIdAndUpdate(product._id, product, { new: true, returnNewDocument: true}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
        }else{
            product = await Products.create(product)
            product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
        }
        savedProducts.push(product);
    }
    return savedProducts;
}