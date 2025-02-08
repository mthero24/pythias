import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";

var SchemaObj = new mongoose.Schema({
    sickDaysPerYear: {type: Number, default: 0},
    vacationDaysPerYear: {type: Number, default: 0},
    daysTakenOff: {type: Number, default: 0},
    accumulatedSickDays: {type: Number, default: 0},
    accumulatedVacationDays: {type: Number, default: 0},
    usedSickDays: [{
      year: Number,
      used: Number,
    }],
    usedVacationDays: [{
      year: Number,
      used: Number,
    }],
    timeOffRequest: [{
      start: Date,
      end: Date,
      approved: {type: Boolean, default: false}
    }],
    schedule: {
      monday: {
        start: Number,
        end: Number
      },
      tuesday: {
        start: Number,
        end: Number
      },
      wednesday: {
        start: Number,
        end: Number
      },
      thursday: {
        start: Number,
        end: Number
      },
      friday: {
        start: Number,
        end: Number
      },
      saturday: {
        start: Number,
        end: Number
      },
      sunday: {
        start: Number,
        end: Number
      },
    },
    makeUpTime: [{
      date: Date,
      start: Number,
      end: Number
    }],
    extraTime: [{
      date: Date,
      start: Number,
      end: Number
    }],
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
  });

export default cluster0.model('PTO', SchemaObj);