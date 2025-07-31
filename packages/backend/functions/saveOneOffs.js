
export const saveOneOffs = async ({data,Seasons, Genders, Themes, SportUsedFor }) => {
    let seasons, genders, themes, sports;
    if (data.type == "season") {
        let season = new Seasons({ name: data.value })
        await season.save()
        seasons = await Seasons.find({})
    }
    else if (data.type == "gender") {
        let season = new Genders({ name: data.value })
        await season.save()
        genders = await Genders.find({})
    } else if (data.type == "theme") {
        let theme = new Themes({ name: data.value })
        await theme.save()
        themes = await Themes.find({})
    } else if (data.type == "sportUsedFor") {
        let sport = new SportUsedFor({ name: data.value })
        await sport.save()
        sports = await SportUsedFor.find({})
    }
    return { seasons, genders, themes, sports }
}