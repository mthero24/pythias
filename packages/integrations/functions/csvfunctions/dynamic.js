const csvFunctions = {
    productSku: (product) => {
        return product.sku ? product.sku : product.name.replace(/ /g, "-").toLowerCase();
    },
    productTitle: (product) => {
        return product.title ? product.title : product.sku;
    },
    productDescription: (product) => {
        return product.description ? product.description : "";
    },
    productDescriptionHtml: (product) => {
        return product.description ? `<p>${product.description}</p>` : "";
    },
    productTags: (product) => {
        return product.tags ? product.tags.join(", ") : "N/A";
    },
    productVendor: (product) => {
        return product.brand ? product.brand : "No Value";
    },
    variantColor: (variant) => {
        return variant.color ? variant.color.name : "";
    },
    variantSize: (variant) => {
        return variant.size ? variant.size.name : "";
    },
    variantThreadColor: (variant) => {
        console.log(variant, "variantThreadColor")
        return variant.threadColor ? variant.threadColor.name : "N/A";
    },
    variantSku: (variant) => {
        return variant.sku ? variant.sku : ""
    },
    variantPrice: (variant) => {
        return variant.size ? `$${variant.size.retailPrice.toFixed(2)}` : 0;
    },
    variantWeight: (variant) => {
        return variant.size ? `${variant.size.weight.toFixed(2)}` : 0;
    },
    variantUpc: (variant) => {
        return variant.upc ? variant.upc : "N/A";
    },
    productImage: (product, index) => {
        if (product.productImages && product.productImages.length > index && product.productImages[index] && product.productImages[index].image) {
            return product.productImages[index].image;
        }
        return "N/A";
    },
    productImageAlt: (product) => {
        return product.name;
    },
    productGender: (product) => {
        return product.gender ? product.gender : "N/A";
    },
    variantImage: (variant, color, blankCode) => {
        //console.log(variant, color, blankCode, "variantImage")
        return variant.image ? variant.image : "N/A";
    },
    variantColorFamily: (variant) => {
        return variant.color && variant.color.colorFamily ? variant.color.colorFamily : "";
    }
};