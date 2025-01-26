import Blanks from "@/modals/Blanks";
import Color from "@/modals/Color";
import PrintPricing from "@/modals/PrintPricing";
import { serialize } from "@/functions/serialize";
import {Main} from "./Main";
export default async function Create(req,res) {
    let colors = await Color.find().sort({ _id: -1 }).lean();
    let printPricing = await PrintPricing.findOne().lean();
    let blanks = await Blanks.find()
      .lean()
      .select("department category brand")
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