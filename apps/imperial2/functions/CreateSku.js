"use client";
export const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${design.printType}_${design.sku}_${color.sku}_${size.name}_${blank.code}${threadColor? `_${threadColor}` : ""}`;
    return sku;
}