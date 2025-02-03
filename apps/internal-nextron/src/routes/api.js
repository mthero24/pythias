import express from "express";
const router = express.Router();
import {getSettings}from "../functions/settings.js"
import { print } from "../functions/printLabel.js";
import { getWeight } from "../functions/getWeight.js";
import { addOutput } from "../functions/output.js";
import axios from "axios";
router.post("/dtf", async (req,res)=>{
    const settings = getSettings()
    let data = req.body
    let resData
    console.log(data)
    addOutput(`Sent image to DTF Printer ${data.printer} PieceID: ${data.sku}`)
    let resp = await axios.post(`http://${settings.dtf[data.printer]}/`, {...data}).catch(e=>{resData = e.response.data})
    if (resp) return res.send(resp.data);
    else if (resData) {
      addOutput(`Error writing image on DTF Printer ${data.printer} PieceID: ${data.sku}`)
      return res.send(resData);
    }else
    addOutput(`Error Could Not Reach DTF Printer ${data.printer} PieceID: ${data.sku}`)
      return res.send({
        error: true,
        msg: "Could not reach file writer!",
      });
})
router.post("/roq-folder", async (req, res) => {
  const settings = getSettings()
  let data = req.body;
  let resData;
  let resp = await axios
    .post(`http://${settings[roq][data.roq]}:3500/roq`, { ...data })
    .catch((e) => {
      resData = e.response?.data;
    });
  if (resp) return res.send(resp?.data);
  else if (resData) return res.send(resData);
  else
    return res.send({
      error: true,
      msg: "Could not reach file writer!",
    });
});
router.post("/shipping/printers", async (req, res)=>{
  const settings = getSettings()
     let data = req.body;
     console.log(data.type, "type route");
     let resp = await print({
       label: data.label,
       printer: `http://${settings.shipping.printers[data.station]}:631/ipp/port1`,
       type: data.type,
     });
     console.log(resp, "route");
     return res.send(resp);
})
router.get("/shipping/scales", async (req,res)=>{
  const settings = getSettings()
     try {
       let resp = await getWeight({
         url: `http://${settings.shipping.scales[req.query.station]}:3003/getweight`,
       });
       console.log(resp);
       return res.send({ ...res });
     } catch (e) {
       console.log("error");
       return res.send({ error: true, msg: JSON.stringify(e) });
     }
})
export default router