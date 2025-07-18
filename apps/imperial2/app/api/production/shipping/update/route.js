import {Bins} from "pythias/mongo";
import {NextResponse} from "next/server"
export async function GET(){
    console.log(Bins)
    let readyToShip = await Bins.find({ ready: true, inUse: true })
        .sort({ number: 1 })
        .populate({ path: "order", populate: "items" })
        .lean();
    let inUse = await Bins.find({ inUse: true, ready: false })
        .sort({ number: 1 })
        .populate({ path: "order", populate: "items" })
        .lean();
    console.log(readyToShip.length, inUse.length)
    readyToShip = JSON.parse(JSON.stringify(readyToShip))
    inUse = JSON.parse(JSON.stringify(inUse));
    return NextResponse.json({bins: {readyToShip, inUse}})
}