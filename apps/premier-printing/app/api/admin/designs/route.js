import {NextApiRequest, NextResponse} from "next/server";
import Design from "@/models/Design";
import { headers } from 'next/headers'
import User from "@/models/User";
import Items from "@/models/Items";
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
import { DesignSearch } from "@/functions/designSearch";
import { createUpc, MarkRecycle, UnMarkRecycle } from "@/functions/createUpcs";
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
        if(!query.q && !query == ""){
            if(query.page == undefined || query.page == 1){
                console.log("page = 1 or undefined")
                designs = await Design.find({}).sort({date: -1}).limit(48)
            }else{
                console.log("page > 1", (query.page - 1) * 48)
                designs = await Design.find({}).sort({date: -1}).skip((query.page - 1) * 48).limit(48)
            }
        }else{
            if(query.page == 1){
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).limit(48)
                if(designs.length == 0) designs = await DesignSearch({q: query.q, page: query.page, productsPerPage: 48})
            }else{
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).skip((query.page - 1) * 48).limit(48)
                if(designs.length == 0) designs = await DesignSearch({q: query.q, page: query.page, productsPerPage: 48})
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
    console.log(data.design.sendToMarketplaces, "send to market places ++++++++++++++++++++++++")
    try{
        let design = await Design.findOneAndUpdate({_id: data.design._id}, {...data.design})
        design = await Design.findOne({_id: design._id}).populate("blanks.blank blanks.colors blanks.defaultColor")
        //console.log(design.published)
        if(design.published){
            //await createUpc({design})
            UnMarkRecycle(design)
        }else{
            MarkRecycle(design)
        }
        await Items.updateMany({designRef: design._id}, {design: design.images})
        if(design.published && design.sendToMarketplaces == false) {
            design.sendToMarketplaces = true
            await design.save()
        }
        //console.log(design.gender, "design")
        //console.log(design.blanks[0])
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