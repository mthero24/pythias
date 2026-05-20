import { Design, SkuToUpc } from "@pythias/mongo";
import { generateUPC as _generateUPC } from "@pythias/backend/server";
export const generateUPC = () => _generateUPC({ Design, SkuToUpc });
