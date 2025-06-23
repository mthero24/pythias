import { NextApiRequest, NextResponse } from "next/server";
import Blanks from "@/models/Blanks";
import Inventory from "@/models/inventory2";
import Color from "@/models/Color";

export async function GET(){
  try{
    let blanks = await Blanks.find({}).select("code name vendor department sales _id").lean().catch(e=>{console.log(e)});
    return NextResponse.json({error: false, blanks})
  }catch(e){
    return NextResponse.json({error: true, msg: JSON.stringify(e)})
  }
}
export async function POST(req = NextApiRequest) {
  let data = await req.json();
  //console.log(data)
  let blank = data.blank
  console.log(blank)
  let newBlank
  try {
    if(blank._id){
      newBlank = await Blanks.findByIdAndUpdate(blank._id, blank) 
      newBlank = await Blanks.findById(blank._id) 
    }
    else {
      let newBlank = new Blanks({ ...blank });
      await newBlank.save();
      await generateInventory(newBlank);
    }
    return NextResponse.json({error: false, blank: newBlank});
  } catch (err) {
    return NextResponse.json(err.toString());
  }
}
export async function DELETE(req = NextApiRequest,) {
  //const body = await req.json();
  //console.log(req.nextUrl.searchParams.get("id"));
  await Blanks.findOneAndDelete({_id: req.nextUrl.searchParams.get("id")})
  return NextResponse.json({ error: false });
}

async function generateInventory(style) {
  let lastBC = await Inventory.find()
    .select("barcode_id")
    .lean()
    .sort({ barcode_id: -1 });
  let barcode_id = 0;
  while (lastBC.map((i) => Number(i.barcode_id)).includes(barcode_id)) {
    barcode_id++;
  }
  let created = [];
  for (let cid of style.colors) {
    let color = await Color.findById(cid);
    for (let size of style.sizes) {
      try {
        let inventory = new Inventory({
          inventory_id: encodeURIComponent(
            `${color.name}-${size.name}-${style.code}`
          ),
          style_code: style.code,
          quantity: 0,
          order_at_quantity: 0,
          desired_order_quantity: 1,
          color,
          color_name: color.name,
          size_name: size.name,
          size,
          last_counted: new Date(),
          barcode_id,
        });
        //console.log(inventory);
        await inventory.save();
        barcode_id++;
        while (lastBC.map((i) => Number(i.barcode_id)).includes(barcode_id)) {
          barcode_id++;
        }
        created.push(inventory);
      } catch (e) {
        console.log("Print Error", e);
      }
    }
  }
  return;
}