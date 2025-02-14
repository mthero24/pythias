import {TSPprints} from '../lib/connection';
import mongoose from 'mongoose';
var schema = new mongoose.Schema({
    pic: String,
    Date: Date
})
export default TSPprints.model('manifest', schema);