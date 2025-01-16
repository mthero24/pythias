import mongoose from "mongoose";
const { TSPprints } = require("../lib/connection");
const schema = new mongoose.Schema({
  date: {
    type: Date,
    default: new Date(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: String,
  },
  type: {
    type: String,
    enum: ['notification', 'support'],
    required: true
  },
  message: {
    type: String,
  },
  read: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
});

export default TSPprints.model("Message", schema);
