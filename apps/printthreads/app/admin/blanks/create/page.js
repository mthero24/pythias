
import {Blank as Blanks, Color, PrintPricing, Vendors, Departments, Categories, Brands, Suppliers, PrintTypes} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import {CreateBlank} from "@pythias/backend";
import PrintLocations from "@/models/printLocations";
import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'; 
export default async function Create(req,res) {
    let colors = await Color.find().sort({ _id: -1 }).lean();
    let printPricing = await PrintPricing.findOne().lean();
    let vendors = await Vendors.find().lean();
    let departments = await Departments.find().lean();  
    let categories = await Categories.find().lean();
    let brands = await Brands.find().lean();
    let suppliers = await Suppliers.find().lean();
    let printTypes = await PrintTypes.find().lean();
    console.log(printPricing, "printPricing")
    let printLocations = await PrintLocations.find({}).lean()
    let blanks = await Blanks.find()
      .lean()
      .select("department category brand multiImages")
      .lean();

    let blank
    let params = await req.searchParams
    if(params && params.id) blank = await Blanks.findById(params.id).populate("printLocations colors");
    else{
      blank = new Blanks({name: "temp", code: "temp"});
      blank = await blank.save();
      return redirect(`/admin/blanks/create?id=${blank._id}`)
    }
    colors = serialize(colors);
    blanks = serialize(blanks);
    blank = serialize(blank);
    printPricing = serialize(printPricing)
    printLocations = serialize(printLocations)
    vendors = serialize(vendors)
    departments = serialize(departments)
    categories = serialize(categories)
    brands = serialize(brands)
    suppliers = serialize(suppliers)
    printTypes = serialize(printTypes)
    return (
      <CreateBlank
        colors={colors}
        blanks={blanks}
        bla={blank}
        printPricing={printPricing}
        locations={printLocations}
        printTypes={printTypes}
        vendors={vendors}
        departments={departments}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
      />
    );
    
}