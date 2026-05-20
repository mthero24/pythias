import { SkuToUpc } from "@pythias/mongo";
import { createUpc as _createUpc, MarkRecycle as _MR, UnMarkRecycle as _UMR } from "@pythias/backend/server";

export const createUpc      = (opts)   => _createUpc({ SkuToUpc }, opts);
export const MarkRecycle    = (design) => _MR({ SkuToUpc }, design);
export const UnMarkRecycle  = (design) => _UMR({ SkuToUpc }, design);
