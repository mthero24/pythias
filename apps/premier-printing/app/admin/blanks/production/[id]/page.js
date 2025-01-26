import Blanks from "@/modals/Blanks";
import { serialize } from "@/functions/serialize";
import { Main } from "./Main";
export default async function Settings(req) {
  //console.log(await req.params)
  let {id} = await req.params;
  let blank = await Blanks.findById(id).lean();
  let blanks = await Blanks.find({});
  //console.log(blanks)
  blank = serialize(blank);
  blanks= serialize(blanks);
  return <Main blank={blank} blanks={blanks} />;
}
