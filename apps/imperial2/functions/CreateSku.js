"use client";
export const CreateSku = async ({blank, color, size, design, threadColor}) => {
    console.log(threadColor, "thread color")
    let sku = `${design.printType}_${design.sku}_${color.name}_${size.name}_${blank.code}${threadColor? `_${threadColor}` : ""}`;
    return sku;
}