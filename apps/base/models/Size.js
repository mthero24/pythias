const mongoose = require('mongoose');
const {cluster1} = require('../lib/connection');
const Schema = mongoose.Schema;
const SchemaObj = new Schema({}, { strict: false });
export default cluster1.model('Size', SchemaObj, 'sizes');
