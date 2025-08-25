
import {Blank as Blanks, Color, PrintPricing} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import {CreateBlank} from "@pythias/backend";
import PrintLocations from "@/models/printLocations";
export const dynamic = 'force-dynamic'; 
export default async function Create(req,res) {
    let colors = await Color.find().sort({ _id: -1 }).lean();
    let printPricing = await PrintPricing.findOne().lean();
    console.log(printPricing, "printPricing")
    let printLocations = await PrintLocations.find({}).lean()
    let blanks = await Blanks.find()
      .lean()
      .select("department category brand multiImages")
      .lean();

    let blank
    let params = await req.searchParams
    if(params && params.id) blank = await Blanks.findById(params.id).populate("printLocations");
    colors = serialize(colors);
    blanks = serialize(blanks);
    blank = serialize(blank);
    printPricing = serialize(printPricing)
    printLocations = serialize(printLocations)
    return (
      <CreateBlank
        colors={colors}
        blanks={blanks}
        bla={blank}
        printPricing={printPricing}
        locations={printLocations}
      />
    );
    
}