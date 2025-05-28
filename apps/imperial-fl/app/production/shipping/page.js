"use server";
import {Main} from "@pythias/shipping";
import Bins from "@/models/Bin"
export default async function Shipping(req,res){
    await Bins
    let stations = JSON.parse(process.env.shipping).shipStations
    let binCount = await Bins.find({}).countDocuments()
    let readyToShip = await Bins.find({ ready: true, inUse: true })
      .sort({ number: 1 })
      .populate({ path: "order", populate: "items marketplace" })
      .lean();
    let inUse = await Bins.find({ inUse: true, ready: false })
      .sort({ number: 1 })
      .populate({ path: "order", populate: "items marketplace" })
      .lean();
    console.log(binCount, readyToShip.length, inUse.length)
    readyToShip = JSON.parse(JSON.stringify(readyToShip))
    inUse = JSON.parse(JSON.stringify(inUse));
    let params = await req.searchParams
    let pieceId = params.pieceId
    let station = params.station
    return <Main stations={stations} binCount={binCount} bins={{readyToShip, inUse}} pieceId={pieceId} stat={station} source={"PP"}/>
}