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
export async function GET(req){
    let query= {q: req.nextUrl.searchParams.get("q"), page: req.nextUrl.searchParams.get("page")}
    try{
        let designs
        if(!query.q){
            if(query.page == undefined || query.page == 1){
                console.log("page = 1 or undefined")
                designs = await Design.find({}).sort({date: -1}).limit(200)
            }else{
                console.log("page > 1", (query.page - 1) * 200)
                designs = await Design.find({}).sort({date: -1}).skip((query.page - 1) * 200).limit(200)
            }
        }else{
            if(query.page == 1){
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).limit(200)
                if(designs.length == 0) designs = await Design.find({name: {$regex: query.q, $options: "si"}}).limit(200)
                console.log(designs.length)
            }else{
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).skip((query.page - 1) * 200).limit(200)
                if(designs.length == 0) designs = await Design.find({name: {$regex: query.q, $options: "si"}}).skip((query.page - 1) * 200).limit(200)
                console.log(designs.length)
            }
        }
        return NextResponse.json({error: false, designs})
    }catch(e){
        console.log(e)
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
            images: {},
            //user: user._id,
            name: `${sku}-${Date.now()}`,
            sku: sku
        })
        console.log(design)
        design  = await design.save()
        return NextResponse.json({error: false, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data, "put")
    try{
        let design = await Design.findOneAndUpdate({_id: data.design._id}, {...data.design})
        console.log(design, "design")
        return NextResponse.json({error: false, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}

export async function DELETE(req, res){
    console.log(await req.nextUrl.searchParams.get("design"))
    let design = await Design.findByIdAndDelete(req.nextUrl.searchParams.get("design"))
    return NextResponse.json({error: false})
}