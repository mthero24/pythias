import {getWeight} from "../../functions/getWeight"

export default async function Test(){
    let weight = await getWeight({url: 'http://192.168.1.61:3003/getweight'})
    console.log(weight)
    return <h1>{weight.error} {weight.system} {weight.value}</h1>
}