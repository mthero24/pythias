import { SkuToUpc } from "@pythias/mongo";

export async function handleGs1DashboardGET({ apiKey, accountNumber, limit = 25, skip = 0, search = "" }) {
    const assignedFilter = { temp: { $ne: true }, recycle: { $ne: true } };
    const searchFilter = search
        ? {
            ...assignedFilter,
            $or: [
                { sku:  { $regex: search, $options: "i" } },
                { upc:  { $regex: search, $options: "i" } },
                { gtin: { $regex: search, $options: "i" } },
            ],
          }
        : assignedFilter;

    const [assigned, tempAvail, onHold, recycled, recentCount, recent] = await Promise.all([
        SkuToUpc.countDocuments(assignedFilter),
        SkuToUpc.countDocuments({ temp: true, hold: { $in: [false, null] }, recycle: { $ne: true } }),
        SkuToUpc.countDocuments({ temp: true, hold: true, recycle: { $ne: true } }),
        SkuToUpc.countDocuments({ recycle: true }),
        SkuToUpc.countDocuments(searchFilter),
        SkuToUpc.find(searchFilter)
            .sort({ _id: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .populate("design", "name sku")
            .populate("blank",  "name code")
            .populate("color",  "name")
            .lean(),
    ]);

    let prefixes = [];
    let apiConnected = false;
    if (apiKey && accountNumber) {
        try {
            const res = await fetch("https://api.gs1us.org/api/v1/myprefix", {
                headers: {
                    ApiKey: apiKey,
                    "X-Product-Owner-Account-Id": accountNumber,
                    "Cache-Control": "no-cache",
                },
                signal: AbortSignal.timeout(8000),
            });
            if (res.ok) {
                prefixes = await res.json();
                apiConnected = true;
            }
        } catch { /* graceful degradation — show local stats only */ }
    }

    return {
        local: { assigned, tempAvail, onHold, recycled },
        prefixes,
        apiConnected,
        recent,
        recentCount,
    };
}
