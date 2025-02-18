import {NextApiRequest, NextResponse} from "next/server";
import Design from "@/models/Design";
import { headers } from 'next/headers'
import User from "@/models/User";
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const createSku = ()=>{
    let sku = ""
    for(let i = 0; i < 10; i++){
        sku= `${sku}${letters[Math.floor(Math.random() * letters.length)]}`
    }
    return sku
}
export async function GET(){
    try{
        let designs = await Design.find({}).sort({date: 1}).limit(200)
        return NextResponse.json({error: false, designs})
    }catch(e){
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let head = await headers()
    console.log(head.get("user"))
    //let user = JSON.parse(head.get("user"));
    //user = await User.findOne({userName: user.userName})
    try{
        let sku = createSku();
        let design = new Design({
            date: new Date(Date.now()), 
            images: {front: data.url},
            //user: user._id,
            name: `${sku}-${Date.now()}`,
            sku: sku
        })
        console.log(design)
        design  = await design.save()
        let designs = await Design.find({}).sort({date: -1}).limit(200)
        return NextResponse.json({error: false, designs, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    try{
        let design = await Design.findOneAndUpdate({_id: data.design._id}, {...data.design})
        console.log(design, "design")
        return NextResponse.json({error: false, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}