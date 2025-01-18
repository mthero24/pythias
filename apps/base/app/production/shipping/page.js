import {Main} from "@pythias/shipping";


export default function Shipping(){
    let stations = JSON.parse(process.env.Shipping).shipStations
    return <Main stations={stations}/>
}