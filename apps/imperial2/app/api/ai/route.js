import OpenAI from 'openai';
// import isLoggedIn from "../../../middleware/isLoggedIn";
// import isAdmin from "../../../middleware/isAdmin";
import { NextApiRequest, NextResponse } from "next/server";



export async function POST(req = NextApiRequest) {
    let data = await req.json();
    let openai = new OpenAI({
        apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
    });

    let prompt = `${data.prompt}`
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 300,
    });
    return NextResponse.json(response.choices[0].message.content);
}
