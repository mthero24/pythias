import { NextResponse } from "next/server";

export async function POST(request) {
  const { email, password } = await request.json();

  // Implement your authentication logic here
  // For demonstration, let's assume a simple validation
  if (email === "user@example.com" && password === "password") {
    const token = "your-jwt-token"; // Replace with actual JWT generation logic
    return NextResponse.json({ token });
  } else {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
