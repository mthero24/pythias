import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { trusted } from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
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
  userName: {type: String, required: true,
    unique: [true, "Account already exists with that user name"],},
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
  apiKey: { type: String },
  alerts: [
    {
      message: String,
      date: { type: Date, default: Date.now() },
      read: Boolean,
    },
  ],
  role: { type: String, default: "production" },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
    console.log("++++++", result, "++++++++++")
    return result;
  } catch (err) {
    console.log(err);
  }
};

export default PremierPrinting.model("User", schema);
