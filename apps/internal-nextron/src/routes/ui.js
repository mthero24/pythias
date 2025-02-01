'use strict'
import express from "express";
const router = express.Router();
import {getOutput, addOutput} from "../functions/output.js"
import {getSettings, updateSettings} from "../functions/settings.js"
router.get("/", async (req,res)=>{
    
    res.render("index", {output: getOutput()});
      
})
router.get("/settings", async (req,res)=>{
    
    res.render("settings", {settings: getSettings()});
      
})
router.get("/output", (req,res)=>{
    
    res.send(getOutput())
})

router.post("/update-settings", async (req,res)=>{
    console.log(req.body.settings)
    let newSettings = await updateSettings(req.body.settings)
    console.log(newSettings)
})
export default router