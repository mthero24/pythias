import { NextApiRequest, NextResponse } from "next/server";
import { Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons, Categories, PrintLocations } from "@pythias/mongo";
import { saveOneOffs } from "@pythias/backend";
export async function POST(req = NextApiRequest) {
    let data = await req.json()
    console.log(data)
    try {
        const { seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons, categories, printLocations } = await saveOneOffs({ data, Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons, Categories, PrintLocations })
        return NextResponse.json({ error: false, seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons, categories, printLocations })
    } catch (e) {
        console.error("Error saving one-offs", e)
        return NextResponse.json({ error: true, msg: `Error saving ${data.type}` })
    }
}

export async function DELETE(req = NextApiRequest) {
    let id = await req.nextUrl.searchParams.get("id")
    let type = await req.nextUrl.searchParams.get("type")
    try {
        if (type == "seasons") {
            await Seasons.deleteOne({ _id: id })
            let seasons = await Seasons.find({})
            return NextResponse.json({ error: false, seasons })
        } else if (type == "genders") {
            await Genders.deleteOne({ _id: id })
            let genders = await Genders.find({})
            return NextResponse.json({ error: false, genders })
        } else if (type == "themes") {
            await Themes.deleteOne({ _id: id })
            let themes = await Themes.find({})
            return NextResponse.json({ error: false, themes })
        } else if (type == "sportUsedFor") {
            await SportUsedFor.deleteOne({ _id: id })
            let sportUsedFor = await SportUsedFor.find({})
            return NextResponse.json({ error: false, sportUsedFor })
        } else if (type == "departments") {
            await Departments.deleteOne({ _id: id })
            let departments = await Departments.find({})
            return NextResponse.json({ error: false, departments })
        } else if (type == "brands") {
            await Brands.deleteOne({ _id: id })
            let brands = await Brands.find({})
            return NextResponse.json({ error: false, brands })
        } else if (type == "suppliers") {
            await Suppliers.deleteOne({ _id: id })
            let suppliers = await Suppliers.find({})
            return NextResponse.json({ error: false, suppliers })
        } else if (type == "vendors") {
            await Vendors.deleteOne({ _id: id })
            let vendors = await Vendors.find({})
            return NextResponse.json({ error: false, vendors })
        } else if (type == "printTypes") {
            await PrintTypes.deleteOne({ _id: id })
            let printTypes = await PrintTypes.find({})
            return NextResponse.json({ error: false, printTypes })
        } else if (type == "repullReasons") {
            await RepullReasons.deleteOne({ _id: id })
            let repullReasons = await RepullReasons.find({})
            return NextResponse.json({ error: false, repullReasons })
        } else if (type == "categories") {
            await Categories.deleteOne({ _id: id })
            let categories = await Categories.find({})
            return NextResponse.json({ error: false, categories })
        } else if (type == "printLocations") {
            await PrintLocations.deleteOne({ _id: id })
            let printLocations = await PrintLocations.find({})
            return NextResponse.json({ error: false, printLocations })
        }
    } catch (e) {
        console.error("Error deleting one-off", e)
        return NextResponse.json({ error: true, msg: `Error deleting ${data.type}` })
    }
}
    