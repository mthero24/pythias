import { NextResponse } from "next/server";
import { Expense } from "@pythias/mongo";

function buildDateFilter(fromYear, fromMonth, toYear, toMonth) {
    if (fromYear === toYear) {
        return { year: fromYear, month: { $gte: fromMonth, $lte: toMonth } };
    }
    const conditions = [{ year: fromYear, month: { $gte: fromMonth } }];
    if (toYear - fromYear > 1) conditions.push({ year: { $gt: fromYear, $lt: toYear } });
    conditions.push({ year: toYear, month: { $lte: toMonth } });
    return { $or: conditions };
}

export async function GET(req) {
    const params = req.nextUrl.searchParams;
    const now  = new Date();
    const from = params.get("from") ?? `${now.getFullYear()}-01`;
    const to   = params.get("to")   ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [fromYear, fromMonth] = from.split("-").map(Number);
    const [toYear,   toMonth]   = to.split("-").map(Number);

    const expenses = await Expense.find(buildDateFilter(fromYear, fromMonth, toYear, toMonth))
        .sort({ year: -1, month: -1, createdAt: -1 })
        .lean();
    return NextResponse.json({ expenses });
}

export async function POST(req) {
    const { description, amount, category, month, year, notes } = await req.json();
    if (!description || amount == null || !month || !year) {
        return NextResponse.json({ error: "description, amount, month, and year are required" }, { status: 400 });
    }
    const expense = await Expense.create({ description, amount: parseFloat(amount), category: category || "General", month, year, notes: notes || "" });
    return NextResponse.json({ expense });
}

export async function PUT(req) {
    const { _id, description, amount, category, month, year, notes } = await req.json();
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const update = { updatedAt: new Date() };
    if (description != null) update.description = description;
    if (amount      != null) update.amount       = parseFloat(amount);
    if (category    != null) update.category     = category;
    if (month       != null) update.month        = month;
    if (year        != null) update.year         = year;
    if (notes       != null) update.notes        = notes;
    const expense = await Expense.findByIdAndUpdate(_id, update, { new: true });
    return NextResponse.json({ expense });
}

export async function DELETE(req) {
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    await Expense.findByIdAndDelete(_id);
    return NextResponse.json({ ok: true });
}
