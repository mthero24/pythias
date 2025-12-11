import {User, ApiKeyIntegrations} from "@pythias/mongo";
import atob from "atob"
import {NextApiRequest, NextResponse} from "next/server";
export async function POST(req=NextApiRequest){
    console.log("herrrrr+++++++++++++++++++")
    let data = await req.json()
    console.log(data)
    
    console.log(data.Basic)
    console.log(atob(data.Basic))
    let userName = atob(data.Basic).split(":")[0]
    let password = atob(data.Basic).split(":")[1]
    console.log(userName, password)
    let user = await User.findOne({$or: [{email: userName}, {userName: userName}]})
    console.log(user)
    if(user){
        console.log(await user.comparePassword(password))
        if(await user.comparePassword(password)){
            let apiKey = await new ApiKeyIntegrations({displayName: `shopify-${data.shop}`, apiKey: data.pythiasToken, provider: "pythias-test"})
            await apiKey.save();
            return NextResponse.json({error: false, token: user.password})
        }else{
            return NextResponse.json({error: true, msg: "User Name or Password are incorrect!"})
        }
    }
    return NextResponse.json({error: true, msg: "User Name or Password are incorrect!"})
}