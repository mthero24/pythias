"use client";
import { CreateSku as _CreateSku } from "@pythias/backend";
// premier-printing uses size.sku
export const CreateSku = (args) => _CreateSku({ ...args, sizeKey: "sku" });
