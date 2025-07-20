import {Blank, MarketPlaces} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import {BlankMain as Main} from "@pythias/backend";
export const dynamic = 'force-dynamic'; 
export default async function Show(req, res){
    //console.log(await req.params);
    let {id} = await req.params;
    let blank = await Blank.findById(id).populate("printLocations").lean()
    let blanks = await Blank.find({}).lean();
    let marketPlaces = await MarketPlaces.find({}).lean();
    blank = serialize(blank);
    marketPlaces = serialize(marketPlaces);
    blanks = serialize(blanks);
    return <Main bla={blank} mPs={marketPlaces} blanks={blanks} />
}