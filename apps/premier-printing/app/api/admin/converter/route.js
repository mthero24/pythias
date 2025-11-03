import { NextApiRequest, NextResponse } from "next/server"
import { Converters } from "@pythias/mongo"

export async function POST(req, res) {
    const { type, oldValue, newValue } = await req.json();
    let converter = await Converters.findOne({ type });
    if (!converter) {
        return NextResponse.json({ error: "Converter not found" }, { status: 404 });
    }
    if(!converter.converter) converter.converter = {};
    converter.converter[oldValue] = newValue;
    converter.markModified('converter');
    converter = await converter.save();
    console.log("Saved converter:", converter);
    return NextResponse.json({ error: false, converter: converter.converter });
}