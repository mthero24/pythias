import { NextApiRequest, NextResponse } from "next/server";
import Bins from "../../../../../models/Bin"
import {add, subtract} from "@pythias/shipping"
import Employee from "../../../../models/employeeTracking";
export async function PUT(req = NextApiRequest) {
    //const defaultBin = {"number":10,"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null}
    let data = await req.json();
    console.log(data)
    if(data.type == "add"){
        try{
            let newBins = add({oldBins: data.binCount, newBins: data.newCount});
            //console.log("new Bins", newBins);
            for (let i = (data.binCount + 1); i <= data.binCount + newBins; i++) {
              let newBin = new Bins({ number: i });
              await newBin.save();
            }
            //console.log("new bin count", await Bins.find({}).countDocuments());
            return NextResponse.json({
              error: false,
              binCount: await Bins.find({}).countDocuments(),
              bins: {
                readyToShip: await Bins.find({ ready: true })
                  .sort({ number: 1 })
                  .populate({ path: "order", populate: "items" })
                  .lean(),
                inUse: await Bins.find({ inUse: true })
                  .sort({ number: 1 })
                  .populate({ path: "order", populate: "items" })
                  .lean(),
              },
            });
        }catch(e){
            console.log(e)
            return NextResponse.json({
              error: true,
              msg: Object.keys(e),
            });
        }
    }else if(data.type == "subtract"){
        try{
            // find bins to subtract
            let binNumbers = subtract({
            binCount: data.binCount,
            newBinCount: data.newCount,
            });
            let binsToRemove = await Bins.find({ number: { $in: binNumbers } });

            // find bins that need to move
            let binsToMove = binsToRemove.filter(b=> b.inUse)
            console.log(binsToMove);

            // move bins
            let movedBins = {};
            if(binsToMove.length > 0){
                for(let oldBin of binsToMove){
                    let newBin = await Bins.findOne({inUse: false})
                    console.log(oldBin, newBin)
                    newBin.items = oldBin.items;
                    newBin.inUse = oldBin.inUse;
                    newBin.ready = oldBin.ready;
                    newBin.order = oldBin.order;
                    newBin.giftWrap = oldBin.giftWrap;
                    newBin.readyToWrap = oldBin.readyToWrap
                    newBin.wrapped = oldBin.wrapped;
                    newBin.wrapImage = oldBin.wrapImage;
                    movedBins[`${oldBin.number}`] = newBin.number;
                    await newBin.save()
                }
            }
            //delete bins
            await Bins.deleteMany({ number: { $in: binNumbers } });
            return NextResponse.json({
              error: false,
              binCount: await Bins.find({}).countDocuments(),
              movedBins,
              bins: {
                readyToShip: await Bins.find({ ready: true })
                  .sort({ number: 1 })
                  .populate({ path: "order", populate: "items" })
                  .lean(),
                inUse: await Bins.find({ inUse: true })
                  .sort({ number: 1 })
                  .populate({ path: "order", populate: "items" })
                  .lean(),
              },
            });
        }catch(e){
             return NextResponse.json({
               error: true,
               msg: Object.keys(e),
             });
        }
    }
}

export async function DELETE(req = NextApiRequest) {
  try{
    let binNumber = req.nextUrl.searchParams.get("number")
    let bin = await Bins.findOneAndUpdate({number: binNumber}, {"items":[],"ready":false,"inUse":false,"order":null,"giftWrap":false,"readyToWrap":false,"wrapped":false,"wrapImage":null})
    let tracking = new Employee({
        type: `Cleared Bin ${binNumber}`,
        Date: new Date(Date.now()),
        //employee: user,
        order: bin.order,
    });
    return NextResponse.json({
      error: false,
      bins: {
        readyToShip: await Bins.find({ ready: true })
          .sort({ number: 1 })
          .populate({ path: "order", populate: "items" })
          .lean(),
        inUse: await Bins.find({ inUse: true })
          .sort({ number: 1 })
          .populate({ path: "order", populate: "items" })
          .lean(),
      },
    });
  }catch(e){
    return NextResponse.json({
      error: true,
      msg: e,
      bins: {
        readyToShip: await Bins.find({ ready: true })
          .sort({ number: 1 })
          .populate({ path: "order", populate: "items" })
          .lean(),
        inUse: await Bins.find({ inUse: true })
          .sort({ number: 1 })
          .populate({ path: "order", populate: "items" })
          .lean(),
      },
    });
  }
}