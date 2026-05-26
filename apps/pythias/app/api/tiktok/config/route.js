import {NextResponse} from "next/server";
import { headers } from "next/headers";
import atob from "atob"
export async function GET(req){
    const headersList = await headers();
    let authorizationHeader = headersList.get("authorization");
    console.log("Authorization:", authorizationHeader);
    let decipher = atob(authorizationHeader.split(" ")[1])
    let userName = decipher.split(":")[0]
    let password = decipher.split(":")[1]
    if(userName == process.env.userName && password == process.env.password){
        let config = {
            app_key: process.env.tiktok_app_key || process.env.Tik_Tok_AppKey,
            app_secret: process.env.tiktok_app_secret || process.env.Tik_Tok_AppSecret,
        }
        return NextResponse.json({error: false, config})
    }
    return NextResponse.json({error: true, msg: "unauthorized"})
}