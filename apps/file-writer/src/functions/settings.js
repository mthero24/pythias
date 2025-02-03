import settings from "./settings.json" with {type: "json"}
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let useSettings = settings


export const getSettings = async ()=>{
    return useSettings
}

export const updateSettings = async (set)=>{
    useSettings = set;
    await fs.writeFileSync(path.join(__dirname, '../settings.json'), JSON.stringify(set), {encoding:'utf8',flag:'w'})
    return {error: false, settings: useSettings}
}