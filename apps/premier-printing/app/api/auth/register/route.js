import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, password, firstName, lastName, userName } = await request.json();
    const newUser = new User({
        userName: userName,
        email: email.toLowerCase(),
        password:  password,        
        first_name: firstName,
        last_name: lastName,
        role: "production",
    });

    await newUser.save();
    return NextResponse.json({ success: "Account created" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}