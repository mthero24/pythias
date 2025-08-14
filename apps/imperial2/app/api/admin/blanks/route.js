import { NextApiRequest, NextResponse } from "next/server";
import {Blank, Color, Inventory} from "@pythias/mongo";

export async function GET(){
  try{
    let blanks = await Blank.find({}).populate("colors").lean().catch(e=>{console.log(e)});
    return NextResponse.json({error: false, blanks})
  }catch(e){
    return NextResponse.json({error: true, msg: JSON.stringify(e)})
  }
}
const updateFold = (blank)=>{
  let newFold = []
  if (!blank.fold) blank.fold = [];
  for(let s of blank.sizes){
    let fold = blank.fold.filter(f=> f.size.toString() == s._id)[0]
    if(fold) {
      fold.sizeName = s.name
      newFold.push(fold)
    }
    else{
      newFold.push({
        size: s._id,
        sizeName: s.name,
        fold: "TSHIRT SML",
        sleeves: 0,
        body: 0
      })
    }
  }
  blank.fold = newFold
  return blank
}
const updateEnvelopes = (blank)=>{
  let newEnvelopes = [];
  console.log(blank.printLocations)
  let printLocations = blank.printLocations.map(l=> {return l.name})
  console.log(printLocations)
  for(let e of blank.envelopes){
    if(printLocations.includes(e.placement)) newEnvelopes.push(e)
  }
  for(let s of blank.sizes){
    //console.log(s)
    for(let loc of printLocations){
      if (!newEnvelopes.filter(e => e.size.toString() == s?._id?.toString() && e.placement == loc)[0]){
        newEnvelopes.push({
          size: s._id,
          sizeName: s.name,
          platen: 2,
          placement: loc,
          horizoffset: 0,
          vertoffset: 0,
          width: 11,
          height: 14
        })
      }else{
        let envelope = newEnvelopes.filter(e => e.size.toString() == s?._id?.toString() && e.placement == loc)[0];
        envelope.sizeName = s.name;
        console.log(envelope, "envelope")
      }
    }
  }
  if(newEnvelopes.length > 0){
    blank.envelopes = newEnvelopes.sort((a,b)=>{
      console.log(a)
      if(a.placement.length > b.placement.length) return -1
      if(a.placement.length < b.placement.length) return 1
      return 0
    })
  }
  return blank
}
let updateInventory = async (blank)=>{
  console.log("update inventory")
  for(let color of blank.colors){
    color = await Color.findById(color)
    for(let size of blank.sizes){
      console.log(color, size.name, size._id)
      let inv = await Inventory.findOne({blank: blank._id, color: color._id, sizeId: size._id})
      console.log(inv, blank._id)
      if(inv){
        inv.color_name = color.name
        inv.size_name = size.name
        inv.style_code = blank.code
        inv.sizeId = size._id
        inv.color = color._id
        inv = await inv.save()
        console.log(inv)
      }else{
        console.log("new")
        let inventory_id = encodeURIComponent(`${color.name}-${size.name}-${blank.code}`)
        let barcode_id= Math.floor(Math.random() * 999999)
        console.log(inventory_id, barcode_id)
        inv = new Inventory({blank: blank._id, style_code: blank.code, inventory_id, barcode_id, color: color._id, color_name: color.name, sizeId: size._id, size_name: size.name, quantity: 0, pending_quantity: 0, order_at_quantity: 0, desired_order_quantity: 1,})
        console.log(inv.inventory_id, inv.barcode_id)
        await inv.save()
      }
    }
  }
}
export async function POST(req = NextApiRequest) {
  let data = await req.json();
  //console.log(data)
  let blank = data.blank
  //console.log(blank, "blank")
  let newBlank
  try {
    if(blank._id){
      if (blank.printLocations?.length > 0 && blank.sizes.length > 0) blank = updateEnvelopes(blank)
      if (blank.sizes.length > 0) blank = updateFold(blank)
      newBlank = await Blank.findByIdAndUpdate(blank._id, blank)
      newBlank = await Blank.findById(blank._id).populate("printLocations") 
      updateInventory(blank)
    }
    else {
      let newBlank = new Blank({ ...blank });
      blank = await newBlank.save();
      if (blank.printLocations?.length > 0 && blank.sizes.length > 0) blank = updateEnvelopes(blank)
      if (blank.sizes.length > 0) blank = updateFold(blank)
      await blank.save()
      generateInventory(blank);
    }
    //console.log(newBlank)
    return NextResponse.json({error: false, blank: newBlank});
  } catch (err) {
    //console.log(err)
    return NextResponse.json(err.toString());
  }
}
export async function DELETE(req = NextApiRequest,) {
  //const body = await req.json();
  //console.log(req.nextUrl.searchParams.get("id"));
  await Blank.findOneAndDelete({_id: req.nextUrl.searchParams.get("id")})
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
          size: size._id,
          last_counted: new Date(),
          barcode_id,
          blank: style._id
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