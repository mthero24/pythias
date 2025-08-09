import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import inventory from "@/models/inventory";

export async function POST(request) {
  try {
    const { email, password, firstName, lastName, userName, permissions } = await request.json();
    if(!permissions) permissions = {
      production: true,
    }
    const newUser = new User({
        userName: userName,
        email: email.toLowerCase(),
        password:  password,        
        firstName: firstName,
        lastName: lastName,
        permissions,
        role: "production",
    });

    await newUser.save();
    let users = await User.find({})
    return NextResponse.json({ success: "Account created", users }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}