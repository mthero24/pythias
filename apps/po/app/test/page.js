
import Styles from "@/models/StyleV2"
import Design from "@/models/Design"
import Colors from "@/models/Color"
import { getCarriers } from "@pythias/shipping"
export default async function Test(){
    let res = await getCarriers({credentials: {apiKey: process.env.ssV2}})
    console.log("res", res)
    console.log(process.env.ssV2)
    return <h1>Test</h1>
}