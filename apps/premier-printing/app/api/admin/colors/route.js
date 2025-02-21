import { NextApiRequest, NextResponse } from "next/server";
import Color from "@/models/Color";

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
    let { color_id, ...newColor } = data;

    let exists = await Color.findByIdAndUpdate(color_id, {...newColor} );
    
    return NextResponse.json(true);
}
