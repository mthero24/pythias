
export const saveOneOffs = async ({data,Seasons, Genders, Themes, SportUsedFor, Departments, Brands, Suppliers, Vendors, PrintTypes, RepullReasons, Categories, PrintLocations }) => {
    let seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons, categories, printLocations;
    if (data.type == "seasons") {
        let season = new Seasons({ name: data.value })
        await season.save()
        seasons = await Seasons.find({})
    }
    else if (data.type == "genders") {
        let season = new Genders({ name: data.value })
        await season.save()
        genders = await Genders.find({})
    } else if (data.type == "themes") {
        let theme = new Themes({ name: data.value })
        await theme.save()
        themes = await Themes.find({})
    } else if (data.type == "sportUsedFor") {
        let sport = new SportUsedFor({ name: data.value })
        await sport.save()
        sportUsedFor = await SportUsedFor.find({})
    } else if (data.type == "departments") {
        let department = new Departments({ name: data.value })
        await department.save()
        departments = await Departments.find({})
    } else if (data.type == "brands") {
        let brand = new Brands({ name: data.value })
        await brand.save()
        brands = await Brands.find({})
    } else if (data.type == "suppliers") {
        let supplier = new Suppliers({ name: data.value })
        await supplier.save()
        suppliers = await Suppliers.find({})
    } else if (data.type == "vendors") {
        let vendor = new Vendors({ name: data.value })
        await vendor.save()
        vendors = await Vendors.find({})
    } else if (data.type == "printTypes") {
        let printType = new PrintTypes({ name: data.value })
        await printType.save()
        printTypes = await PrintTypes.find({})
    } else if (data.type == "repullReasons") {
        let repullReason = new RepullReasons({ name: data.value })
        await repullReason.save()
        repullReasons = await RepullReasons.find({})
    }else if (data.type == "categories") {
        let category = new Categories({ name: data.value })
        await category.save()
        categories = await Categories.find({})
    }else if (data.type == "printLocations") {
        let printLocation = new PrintLocations({ name: data.value })
        await printLocation.save()
        printLocations = await PrintLocations.find({})
    }
    return { seasons, genders, themes, sportUsedFor, departments, brands, suppliers, vendors, printTypes, repullReasons, categories, printLocations }
}

