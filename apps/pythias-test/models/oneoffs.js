const mongoose = require("mongoose");
const { PremierPrinting } = require("../lib/connection");
const Schema = mongoose.Schema;
const SchemaObj = new Schema(
  {
    name: String,
  },
  { strict: false }
);
export const Seasons = PremierPrinting.model("Seasons", SchemaObj, "Seasons");
export const Genders = PremierPrinting.model("Genders", SchemaObj, "Genders");

