import {NextApiRequest, NextResponse} from "next/server";
import {User} from "@pyhtias/mongo";
import { findOneAndDelete } from "@/models/PrintPricing";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let user = await User.findById({_id: data.user._id})
    user.password = data.password
    await user.save()
    let users = await User.find({})
    return NextResponse.json({error: false, users})
}

export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let user = await User.findByIdAndUpdate(data.user._id, {...data.user})
    let users = await User.find({})
    return NextResponse.json({error: false, users})
}

export async function DELETE(req){
    console.log(req.nextUrl.searchParams.get("user"))
    let user = await User.findOneAndDelete({_id: req.nextUrl.searchParams.get("user")})
    console.log(user)
    let users = await User.find({})
    return NextResponse.json({error: false, users})
}