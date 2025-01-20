import {Main} from "@pythias/shipping";
import Bins from "../.../../../../models/Bin"

export default async function Shipping(){
    let stations = JSON.parse(process.env.Shipping).shipStations
    let binCount = await Bins.find({}).countDocuments()
    let readyToShip = await Bins.find({ ready: true, inUse: true })
      .sort({ number: 1 })
      .populate({ path: "order", populate: "items" })
      .lean();
    let inUse = await Bins.find({ inUse: true, ready: false })
      .sort({ number: 1 })
      .populate({ path: "order", populate: "items" })
      .lean();
    console.log(binCount, readyToShip.length, inUse.length)
    readyToShip = JSON.parse(JSON.stringify(readyToShip))
    inUse = JSON.parse(JSON.stringify(inUse));
    return <Main stations={stations} binCount={binCount} bins={{readyToShip, inUse}}/>
}