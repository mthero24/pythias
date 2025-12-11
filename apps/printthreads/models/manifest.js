import { PremierPrinting }  from "../lib/connection";
import mongoose from 'mongoose';
var schema = new mongoose.Schema({
    pic: String,
    Date: Date
})
export default PremierPrinting.model('manifest', schema);