import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const schema = new mongoose.Schema({
    client: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    stripePaymentMethodId: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
});

export default PremierPrintingDB.model("BillingCustomer", schema, "billing_customers");
