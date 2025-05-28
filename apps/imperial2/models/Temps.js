import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
import Order from "./Order"
let schema = new mongoose.Schema({
   light: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   dark: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   ash: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   pressLight: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   pressDark: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   pressAsh: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   printedLight: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   printedDark: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   printedAsh: {
    temp: {type: Number, default: 0},
    time: {type: Number, default: 0},
   },
   aStyles: [
      String
   ]
})
export default PremierPrinting.model('Temps', schema);