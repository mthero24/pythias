import { OutreachProspect } from "@pythias/mongo";

// PUBLIC — no auth. The {{unsub}} link in outreach emails points here with the prospect's token.
function page(message) {
    return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — Pythias Technologies</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;color:#222">
  <div style="max-width:520px;margin:80px auto;padding:40px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;text-align:center">
    <div style="font-size:22px;font-weight:700;color:#D3A73D;margin-bottom:16px">Pythias Technologies</div>
    <p style="font-size:16px;line-height:1.6;color:#374151">${message}</p>
    <p style="font-size:13px;color:#9ca3af;margin-top:24px">Pythias Technologies · 1421 Hidden View Drive, Lapeer, MI 48446</p>
  </div>
</body></html>`;
}

export async function GET(req) {
    const token = new URL(req.url).searchParams.get("token");
    const headers = { "content-type": "text/html; charset=utf-8" };

    if (!token) {
        return new Response(page("This unsubscribe link is invalid or incomplete."), { status: 400, headers });
    }

    try {
        const doc = await OutreachProspect.findOneAndUpdate(
            { unsubToken: token },
            { $set: { status: "unsubscribed", nextSendAt: null } },
            { new: true }
        );
        if (!doc) {
            return new Response(page("We couldn't find that subscription — you may already be unsubscribed."), { status: 200, headers });
        }
        return new Response(
            page("You're unsubscribed. You won't receive any more emails from us. Thanks for your time."),
            { status: 200, headers }
        );
    } catch (err) {
        console.error("[outreach unsubscribe]", err);
        return new Response(page("Something went wrong. Please email michaelthero@pythiastechnologies.com to be removed."), { status: 500, headers });
    }
}
