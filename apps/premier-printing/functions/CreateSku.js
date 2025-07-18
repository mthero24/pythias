"use client";
export const CreateSku = async ({blank, color, size, design, threadColor}) => {
    console.log(threadColor, "thread color")
    let sku = `${blank.code}__${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}_${design.sku}${threadColor? `_${threadColor}` : ""}`;
    return sku;
}