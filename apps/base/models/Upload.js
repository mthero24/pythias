import mongoose from "mongoose";
const {TSPprints} = require('../lib/connection');

const schema = new mongoose.Schema({
    name: {type: String, required:true},
    status: {type: String, required: true},
    date: {
        type: Date,
        default: new Date()
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
});

export default TSPprints.model('Upload', schema);
