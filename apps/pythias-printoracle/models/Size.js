import mongoose from "mongoose";
import { cluster1 }  from "../lib/connection";
const Schema = mongoose.Schema;
const SchemaObj = new Schema({}, { strict: false });
export default cluster1.model('Size', SchemaObj, 'sizes');
