import { Blank, MarketPlaces } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import {BlankMain as Main} from "@pythias/backend";
export const dynamic = 'force-dynamic'; 
export default async function Show(req, res){
    let {id} = await req.params;
    let blank = await Blank.findById(id).populate("printLocations").lean()
    let blanks = await Blank.find({}).select("sizes").populate("colors").lean();
    let marketPlaces = await MarketPlaces.find({}).lean();
    marketPlaces = serialize(marketPlaces);
    blank = serialize(blank);
    blanks = serialize(blanks);
    return <Main bla={blank} mPs={marketPlaces} />
}