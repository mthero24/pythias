"use server";
import { Main } from "@pythias/shipping";
import { Settings, Bin as Bins } from "@pythias/mongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function Shipping(req, res) {
    await Bins;
    const session = await getServerSession(authOptions);
    const trainingMode = !!session?.user?.permissions?.shipTraining;

    // Load stations from DB (Settings), fall back to env
    let stations = [];
    try {
        const doc = await Settings.findOne({ key: "production" }).lean();
        const prod = doc?.value ? JSON.parse(doc.value) : {};
        stations = prod.shippingStations ?? [];
    } catch {}

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
    return <Main stations={stations} binCount={binCount} bins={{readyToShip, inUse}} pieceId={pieceId} stat={station} source={"PP"} trainingMode={trainingMode}/>
}