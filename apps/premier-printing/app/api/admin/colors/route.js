import { NextApiRequest, NextResponse } from "next/server";
import Color from "@/models/Color";

export async function GET(req = NextApiRequest) {
  let colors = await Color.find({}).lean();
  return NextResponse.json({ error: false, colors });
}
export async function POST(req = NextApiRequest) {
  let data = await req.json();
  let { color } = data;
  let exists = await Color.findOne({ _id: color?._id });
  if (exists) {
    for (let key in color) {
      exists[key] = color[key];
    }
    //console.log(exists);
    await exists.save();
    return NextResponse.json({ color: exists });
  } else {
    let newColor = new Color({ ...color });
    //console.log(newColor);
    await newColor.save();
    return NextResponse.json({ color: newColor });
  }
}
export async function PUT(req = NextApiRequest) {
    let data = await req.json();
    console.log(data)
    let { color } = data;
    console.log(color)
    let exists = await Color.findByIdAndUpdate(color._id, color );
    let colors = await Color.find({}).lean()
  
    return NextResponse.json({error: false, colors});
}
export async function DELETE(req = NextApiRequest) {
  let id = await req.nextUrl.searchParams.get("id")
  await Color.findOneAndDelete({_id: id})
  let colors = await Color.find({})
  return NextResponse.json({error: false, colors});
}
