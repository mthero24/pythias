import { Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons } from "@pythias/mongo";
import { serialize, Edit } from "@pythias/backend";

export default async function EditPage(){
    let seasons = await Seasons.find().catch(e=> console.log(e)).lean();
    let genders = await Genders.find().catch(e=> console.log(e)).lean();
    let themes = await Themes.find().catch(e=> console.log(e)).lean();
    let sportUsedFor = await SportUsedFor.find().catch(e=> console.log(e)).lean();
    let departments = await Departments.find().catch(e=> console.log(e)).lean();
    let brands = await Brands.find().catch(e=> console.log(e)).lean();
    let suppliers = await Suppliers.find().catch(e=> console.log(e)).lean();
    let vendors = await Vendors.find().catch(e=> console.log(e)).lean();
    let printTypes = await PrintTypes.find().catch(e=> console.log(e)).lean();
    let repullReasons = await RepullReasons.find().catch(e=> console.log(e)).lean();
    let data = serialize({seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons})
    return <Edit data={data} />
}