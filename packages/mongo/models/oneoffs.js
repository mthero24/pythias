const mongoose = require("mongoose");
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
    price: {type:Number, default:0},
  },
  { strict: false }
);
export const Seasons = PremierPrinting.model("Seasons", SchemaObj, "Seasons");
export const Genders = PremierPrinting.model("Genders", SchemaObj, "Genders");
export const Themes = PremierPrinting.model("Themes", SchemaObj, "Themes");
export const SportUsedFor = PremierPrinting.model("SportUsedFor", SchemaObj, "SportUsedFor");
export const Categories = PremierPrinting.model("Categories", SchemaObj, "Categories");
export const Departments = PremierPrinting.model("Departments", SchemaObj, "Departments");
export const Brands = PremierPrinting.model("Brands", SchemaObj, "Brands");
export const Suppliers = PremierPrinting.model("Suppliers", SchemaObj, "Suppliers");
export const Vendors = PremierPrinting.model("Vendors", SchemaObj, "Vendors");
export const PrintTypes = PremierPrinting.model("PrintTypes", SchemaObj, "PrintTypes");
export const RepullReasons = PremierPrinting.model("RepullReasons", SchemaObj, "RepullReasons");

