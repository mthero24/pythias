import {Design} from "@pythias/mongo"
export default async function Test(){
    let design = await Design.findOne({ sku: "18475B_F"}).populate("blanks.blank blanks.colors")
    console.log("design", design)
    for(let b of design.blanks){
        console.log("blank", b.blank.code, b.colors.map(c => c.name))
    }
    return <h1>test</h1>
}