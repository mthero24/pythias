import Blanks from "@/models/Blanks";
import Color from "@/models/Color";
import PrintPricing from "@/models/PrintPricing";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
export const dynamic = 'force-dynamic'; 
export default async function Create(req,res) {
    let colors = await Color.find().sort({ _id: -1 }).lean();
    let printPricing = await PrintPricing.findOne().lean();
    let blanks = await Blanks.find()
      .lean()
      .select("department category brand multiImages")
      .lean();

    let blank
    let params = await req.searchParams
    if(params && params.id) blank = await Blanks.findById(params.id);
    colors = serialize(colors);
    blanks = serialize(blanks);
    blank = serialize(blank);
    printPricing = serialize(printPricing)
    return (
      <Main
        colors={colors}
        blanks={blanks}
        blank={blank}
        printPricing={printPricing}
      />
    );
    
}