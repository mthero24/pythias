import Bins from "@/models/returnBins"

export default async function Returns(){
    let binsInUse = await Bins.find({})
    let binCount = await Bins.find().countDocuments()
    return <h1>{binCount}</h1>
}