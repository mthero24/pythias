import { Blank } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Main } from "./Main";
export const dynamic = 'force-dynamic';
export default async function Settings(req) {
  //console.log(await req.params)
  let {id} = await req.params;
  let blank = await Blank.findById(id).populate("printLocations").lean();
  //console.log(blanks)
  blank = serialize(blank);
  return <Main bla={blank} />;
}
