"use client";
import { CreateSku as _CreateSku } from "@pythias/backend";
// pythias-test uses size.name
export const CreateSku = (args) => _CreateSku({ ...args, sizeKey: "name" });
