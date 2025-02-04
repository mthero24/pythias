import {getRates} from "@pythias/shipping";
import Temps from "../../models/Temps"
import {Main} from "./Main"
export default async function Test(){
    let temp = await Temps.findOne({})
    if(temp == undefined || temp == null) {
        temp = new Temps({light: {temp: 320, time: 50}, dark: {temp: 360, time: 60}})
        await temp.save()
    }
    if(temp.aStyles == undefined) {
        temp.aStyles = [];
        await temp.save()
    }
    if(temp) temp = JSON.parse(JSON.stringify(temp))
    return <Main temp={temp}/>
}