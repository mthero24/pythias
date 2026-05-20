export const createImage = (colorName, styleCode, options, width = 700) => {
    if (!colorName) return '';
    const side = options.side || 'garment';
    if (options.url) {
        return `https://images4.tshirtpalace.com/images/productImages/SKU--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?url=${options.url}&width=${width}`;
    }
    if (options.sku) {
        return `https://images4.tshirtpalace.com/images/productImages/${options.sku}--${colorName.toLowerCase()}-${styleCode.toLowerCase()}-${side}.webp?width=${width}`;
    }
    return '';
};
