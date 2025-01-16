import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const { TSPprints } = require("../lib/connection");

const schema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Account already exists with that email"],
  },
  phoneNumber: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  addresses: [
    {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      address1: { type: String, default: "" },
      address2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      zip: { type: String, default: "" },
      billingAddress: { type: Boolean },
    },
  ],
  percentageDiscount: { type: Number, default: 0 },
  apiKey: { type: String },
  isAdmin: { type: Boolean, default: false },
  authorizeCustomerProfileId: String,
  alerts: [
    {
      message: String,
      date: { type: Date, default: Date.now() },
      read: Boolean,
    },
  ],
  shopifyAccessToken: { type: String },
  shopifyShopName: { type: String },
  etsyAccessToken: { type: String },
  etsyRefreshToken: { type: String },
  type: { type: String, default: "customer" },
  isSalesMan: { type: Boolean, default: false },
  prices: {},
  managed: { type: Boolean, default: false },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  commission: { type: Number, default: 0 },
  affiliateCode: { type: String, unique: true },
  appliedAffiliateCode: { type: String },
  balance: { type: Number, default: 0.0 },
  paymentMethods: {
    primaryPaymentMethod: {
      paymentProfileId: String,
      paymentType: String,
      paymentNumber: String,
      source: String,
      provider: String,
    },
    secondaryPaymentMethods: [{}],
  },
  credit: {
    approved: { type: Boolean, default: false },
    amountApproved: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  tierQuantity: { type: Number, default: 0 },
});

schema.pre("save", async function () {
  if (this.isModified("password")) {
    await new Promise((resolve, reject) => {
      bcrypt.hash(this.password, 8, (err, hash) => {
        if (err) {
          return reject(err);
        }
        this.password = hash;
        return resolve();
      });
    });
  }
});

schema.methods.comparePassword = async function (password) {
  if (!password) throw new Error("Password is missing");
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (err) {
    console.log(err);
  }
};

export default TSPprints.model("User", schema);
