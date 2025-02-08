import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
import User from "./User"
let schema = new mongoose.Schema({
    accounts: [{}],
    institution: {
        name: String,
        institution_id: String
    },
    account_id: String,
    pk: {
        accessToken: String,
        item_id: String
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: User},
})
export default TSPprints.model('BanAcc', schema);