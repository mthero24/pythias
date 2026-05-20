"use client";
import { CreateSku as _CreateSku } from "@pythias/backend";
// printthreads uses size.name
export const CreateSku = (args) => _CreateSku({ ...args, sizeKey: "name" });
