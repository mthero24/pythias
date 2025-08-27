import { Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons, Categories } from "@pythias/mongo";
import { serialize, Edit } from "@pythias/backend";

export default async function EditPage(){
    try{
        let seasons = await Seasons.find().lean();
        let genders = await Genders.find().lean();
        let themes = await Themes.find().lean();
        let sportUsedFor = await SportUsedFor.find().lean();
        let departments = await Departments.find().lean();
        let brands = await Brands.find().lean();
        let suppliers = await Suppliers.find().lean();
        let vendors = await Vendors.find().lean();
        let printTypes = await PrintTypes.find().lean();
        let repullReasons = await RepullReasons.find().lean();
        let categories = await Categories.find().lean();
        console.log("brands", brands)
        let data = serialize({seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons, categories})
        return <Edit data={data} />
    }catch(e){
        console.log(e)
        data = {seasons:[], genders:[], themes:[], sportUsedFor:[], departments:[], brands:[], suppliers:[], vendors:[], printTypes:[], repullReasons:[], categories:[]}
        return <Edit data={data} />
    }
}