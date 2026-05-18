import Temps from "../../models/Temps";
import { SettingsMain } from "./Main";

export const dynamic = "force-dynamic";

export default async function ProductionSettings() {
    let temp = await Temps.findOne({});
    if (!temp) {
        temp = new Temps({ light: { temp: 320, time: 50 }, dark: { temp: 360, time: 60 } });
        await temp.save();
    }
    if (!temp.aStyles) {
        temp.aStyles = [];
        await temp.save();
    }
    return <SettingsMain temp={JSON.parse(JSON.stringify(temp))} />;
}
