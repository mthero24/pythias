import {AccountMain} from "@pythias/backend";
import {User} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { serialize } from "@/functions/serialize";
import {headers} from "next/headers"
export default async function Account(req){
    console.log("just premier printing account page")
    const headersList = await headers()
    console.log(headersList.get("user"))
    let user = await User.findOne({userName: headersList.get("user")})
    console.log(user)
    user = serialize(user)
    return <AccountMain user={user} />
}