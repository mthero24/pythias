"use client";
export const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${blank.code}_${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}_${design.sku}${threadColor? `_${threadColor}` : ""}`;
    return sku;
}