import { Color, Inventory } from "@pythias/mongo";
import { generateInventory as _gen } from "@pythias/backend/server";
export const generateInventory = (style) => _gen({ Color, Inventory }, style);
