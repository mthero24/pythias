import express from "express";
const router = express.Router();
import { print } from "../functions/printLabel.js";
let printers = {
  station1: "http://192.168.1.94:631/ipp/port1",
  station2: "http://192.168.1.113:631/ipp/port1",
  station3: "http://192.168.1.114:631/ipp/port1",
  station4: "http://192.168.1.254:631/ipp/port1",
  station5: "http://192.168.1.13:631/ipp/port1",
};
import { getWeight } from "../functions/getWeight.js";
const stations = {
  station1: "http://192.168.1.110:3003/getweight",
  station2: "http://192.168.1.109:3003/getweight",
  station3: "http://192.168.1.108:3003/getweight",
  station4: "http://192.168.1.111:3003/getweight",
  station5: "http://192.168.1.61:3003/getweight",
};
router.post("/dtf", async (req,res)=>{
    let data = req.body
    let resData
    console.log(data)
    let resp = await axios.post(`http://localhost:3500/`, {...data}).catch(e=>{resData = e.response.data})
    if (resp) return res.send(resp.data);
    else if (resData) return res.send(resData);
    else
      return res.send({
        error: true,
        msg: "Could not reach file writer!",
      });
})
router.post("/roq-folder", async (req, res) => {
  let data = req.body;
  let resData;
  let resp = await axios
    .post(`http://localhost:3500/roq`, { ...data })
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
     let data = req.body;
     console.log(data.type, "type route");
     let resp = await print({
       label: data.label,
       printer: printers[data.station],
       type: data.type,
     });
     console.log(resp, "route");
     return res.send(resp);
})
router.get("/shipping/scales", async (req,res)=>{
     try {
       let resp = await getWeight({
         url: stations[req.query.station],
       });
       console.log(resp);
       return res.send({ ...res });
     } catch (e) {
       console.log("error");
       return res.send({ error: true, msg: JSON.stringify(e) });
     }
})
export default router