import { Seasons, Genders, Themes, SportUsedFor, Departments, Suppliers, Vendors, PrintTypes, RepullReasons, Categories, PrintLocations } from "@pythias/mongo";
import { serialize, Edit } from "@pythias/backend";
export const dynamic = 'force-dynamic';
export default async function EditPage() {
    try {
        const [seasons, genders, themes, sportUsedFor, departments, suppliers, vendors, printTypes, repullReasons, categories, printLocations] = await Promise.all([
            Seasons.find().lean(),
            Genders.find().lean(),
            Themes.find().lean(),
            SportUsedFor.find().lean(),
            Departments.find().lean(),
            Suppliers.find().lean(),
            Vendors.find().lean(),
            PrintTypes.find().lean(),
            RepullReasons.find().lean(),
            Categories.find().lean(),
            PrintLocations.find().lean(),
        ]);
        const data = serialize({ seasons, genders, themes, sportUsedFor, departments, suppliers, vendors, printTypes, repullReasons, categories, printLocations });
        return <Edit data={data} brandsPath="/admin/brands" />;
    } catch (e) {
        console.error(e);
        const data = { seasons: [], genders: [], themes: [], sportUsedFor: [], departments: [], suppliers: [], vendors: [], printTypes: [], repullReasons: [], categories: [], printLocations: [] };
        return <Edit data={data} brandsPath="/admin/brands" />;
    }
}