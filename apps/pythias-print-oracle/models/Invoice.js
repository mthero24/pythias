import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  poNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'invoiced', 'paid', 'forced']
  },
  shippingAddress: {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    zip: {
      type: String,
    },
  },
  billingAddress: {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    zip: {
      type: String,
    },
  },
  discount: Number,
  items : [],
  shippingType: {type:"String", default:'Standard'},
  orderType: String,
  archived: {type: Boolean, default: false}
});

export default TSPprints.model("Invoice", schema);
