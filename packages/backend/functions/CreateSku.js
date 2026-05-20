"use client";

// sizeKey: "sku" (default, premier-printing) or "name" (printthreads, pythias-test)
export const CreateSku = async ({ blank, color, size, design, threadColor, sizeKey = "sku" }) => {
    return `${blank.code}_${color.sku}_${size[sizeKey]}${threadColor ? `_${threadColor}` : ""}_${design.sku}`;
};
