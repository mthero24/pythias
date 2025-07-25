import mongoose from "mongoose"
import { Pythias } from "../lib/connection";
let schema = new mongoose.Schema({
    access_token: String,
    access_token_expire_in: Number,
    refresh_token: String,
    refresh_token_expire_in: Number,
    open_id: String,
    seller_name: String,
    user_type: Number,
    granted_scopes: Array,
    date: Date,
    provider: String,
    user: String,
    shop_list: Array
})
export default Pythias.model("TikTokAuth", schema);