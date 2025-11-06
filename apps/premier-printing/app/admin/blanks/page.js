import { BlanksComponent, serialize } from "@pythias/backend";
import { Blank, Items, MarketPlaces } from "@pythias/mongo";
export const dynamic = 'force-dynamic';
export default async function Blanks() {
  let blanks = await Blank.find({}).select("code name vendor department sales _id, multiImages category sizes marketPlaceOverrides images").lean().catch(e => { console.log(e) });
  let items = await Items.find({ canceled: false, date: { $gte: new Date(Date.now() - 30 * (24 * 60 * 60 * 1000)) } }).select("styleCode").lean().catch(e => { console.log(e) });
  let marketPlaces = await MarketPlaces.find({}).lean();
  console.log(items.length, "items in last 30 days")
  blanks = blanks.map(b => {
    let sales = items.filter(i => i.styleCode === b.code).length;
    return { ...b, sales }
  });
  if (blanks) blanks = serialize(blanks)
  else blanks = []
  if (marketPlaces) marketPlaces = serialize(marketPlaces)
  else marketPlaces = []
  return (
    <BlanksComponent blanks={blanks} mPs={marketPlaces} source="test" />
  )
}