import { NextResponse } from "next/server";
import { Order, Items, Blank, ForecastCache } from "@pythias/mongo";

const APP_KEY = "pythias-test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fillDays(since, until, rows) {
    const map = Object.fromEntries(rows.map(r => [r.date, r]));
    const out = []; const cur = new Date(since); const end = new Date(until);
    while (cur <= end) { const d = isoDate(cur); out.push(map[d] ?? { date: d, revenue: 0, orders: 0 }); cur.setDate(cur.getDate() + 1); }
    return out;
}

function groupByMonth(rows) {
    const map = {};
    for (const r of rows) {
        const m = r.date.slice(0, 7);
        if (!map[m]) map[m] = { date: m, _hasActual: false, actual: 0, actualNet: 0, linear: 0, ema: 0, ma: 0, linearNet: 0, emaNet: 0, maNet: 0 };
        const e = map[m];
        if (r.actual != null) { e.actual += r.actual; e.actualNet += (r.actualNet ?? 0); e._hasActual = true; }
        e.linear += r.linear || 0; e.ema += r.ema || 0; e.ma += r.ma || 0;
        e.linearNet += r.linearNet || 0; e.emaNet += r.emaNet || 0; e.maNet += r.maNet || 0;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(({ _hasActual, ...r }) => ({ ...r, actual: _hasActual ? r.actual : null, actualNet: _hasActual ? r.actualNet : null }));
}

function fitLinear(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] ?? 0, rmse: null };
    const sx = n*(n-1)/2, sx2 = n*(n-1)*(2*n-1)/6, sy = values.reduce((a,b)=>a+b,0), sxy = values.reduce((a,v,i)=>a+i*v,0);
    const d = n*sx2 - sx*sx, slope = d===0 ? 0 : (n*sxy - sx*sy)/d, intercept = (sy - slope*sx)/n;
    const fitted = values.map((_,i) => Math.max(0, intercept + slope*i));
    return { slope, intercept, rmse: Math.sqrt(values.reduce((acc,v,i)=>acc+(v-fitted[i])**2,0)/n) };
}
function predictLinear({slope,intercept}, hOffset, horizon) { return Array.from({length:horizon},(_,h)=>Math.max(0,intercept+slope*(hOffset+h))); }

function fitHolt(values, alpha=0.25, beta=0.05) {
    if (values.length<2) return {level:values[0]??0,trend:0,fitted:[values[0]??0],rmse:null};
    let level=values[0], trend=values[1]-values[0]; const fitted=[level];
    for (let i=1;i<values.length;i++) { const p=level; level=alpha*values[i]+(1-alpha)*(level+trend); trend=beta*(level-p)+(1-beta)*trend; fitted.push(Math.max(0,level)); }
    return {level,trend,fitted,rmse:Math.sqrt(values.reduce((a,v,i)=>a+(v-fitted[i])**2,0)/values.length)};
}
function predictHolt({level,trend},horizon) { return Array.from({length:horizon},(_,h)=>Math.max(0,level+(h+1)*trend)); }

function fitMA(values, window=7) {
    const fitted = values.map((_,i)=>{ const s=values.slice(Math.max(0,i-window+1),i+1); return s.reduce((a,b)=>a+b,0)/s.length; });
    const drift = values.length>=2 ? (values[values.length-1]-values[Math.max(0,values.length-30)])/Math.min(30,values.length-1) : 0;
    return {base:fitted[fitted.length-1]??0,drift,fitted,rmse:Math.sqrt(values.reduce((a,v,i)=>a+(v-fitted[i])**2,0)/values.length)};
}
function predictMA({base,drift},horizon) { return Array.from({length:horizon},(_,h)=>Math.max(0,base+drift*(h+1))); }

const sum = arr => arr.reduce((a,b)=>a+b,0);

// ─── Build response from cached payload for a given horizon ───────────────────

function generateResponse(payload, horizon) {
    const { historical, linRev, holtRev, maRev, linNet, holtNet, maNet, linOrd, holtOrd, maOrd, annualProjections, best, trendPct } = payload;
    if (!historical || historical.length < 14) return { historical:historical||[], combined:[], combinedOrders:[], combinedMonthly:[], annualProjections:[], models:{}, horizon, minDataWarning:true };

    const n = historical.length;
    const lastDate = new Date(historical[n-1].date);
    const forecastDates = Array.from({length:horizon},(_,h)=>{ const d=new Date(lastDate); d.setDate(d.getDate()+h+1); return isoDate(d); });

    const lRF=predictLinear(linRev,n,horizon), hRF=predictHolt(holtRev,horizon), mRF=predictMA(maRev,horizon);
    const lNF=predictLinear(linNet,n,horizon), hNF=predictHolt(holtNet,horizon), mNF=predictMA(maNet,horizon);
    const lOF=predictLinear(linOrd,n,horizon), hOF=predictHolt(holtOrd,horizon), mOF=predictMA(maOrd,horizon);

    const combined = [
        ...historical.map((d,i)=>({date:d.date,actual:d.revenue,actualNet:d.net,linear:Math.round(Math.max(0,linRev.intercept+linRev.slope*i)),ema:Math.round(holtRev.fitted[i]),ma:Math.round(maRev.fitted[i]),linearNet:Math.round(Math.max(0,linNet.intercept+linNet.slope*i)),emaNet:Math.round(holtNet.fitted[i]),maNet:Math.round(maNet.fitted[i])})),
        ...forecastDates.map((date,h)=>({date,actual:null,actualNet:null,linear:Math.round(lRF[h]),ema:Math.round(hRF[h]),ma:Math.round(mRF[h]),linearNet:Math.round(lNF[h]),emaNet:Math.round(hNF[h]),maNet:Math.round(mNF[h])})),
    ];
    const combinedOrders = [
        ...historical.map((d,i)=>({date:d.date,actual:d.orders,linear:Math.max(0,Math.round(linOrd.intercept+linOrd.slope*i)),ema:Math.max(0,Math.round(holtOrd.fitted[i])),ma:Math.max(0,Math.round(maOrd.fitted[i]))})),
        ...forecastDates.map((date,h)=>({date,actual:null,linear:Math.max(0,Math.round(lOF[h])),ema:Math.max(0,Math.round(hOF[h])),ma:Math.max(0,Math.round(mOF[h]))})),
    ];
    const combinedMonthly = groupByMonth(combined);
    const models = {
        linearRegression:     { label:"Linear Regression",     color:"#e65100", rmseRev:Math.round(linRev.rmse),  forecastTotal:Math.round(sum(lRF)), forecastOrders:Math.round(sum(lOF)) },
        exponentialSmoothing: { label:"Exp. Smoothing (Holt)", color:"#7b1fa2", rmseRev:Math.round(holtRev.rmse), forecastTotal:Math.round(sum(hRF)), forecastOrders:Math.round(sum(hOF)) },
        movingAverage:        { label:"Moving Average",        color:"#2e7d32", rmseRev:Math.round(maRev.rmse),   forecastTotal:Math.round(sum(mRF)), forecastOrders:Math.round(sum(mOF)) },
    };
    return { historical, combined, combinedOrders, combinedMonthly, annualProjections, models, best, horizon, trendPct };
}

// ─── Fit models on a historical series ───────────────────────────────────────

function fitPayload(historical) {
    const revVals=historical.map(d=>d.revenue), netVals=historical.map(d=>d.net), ordVals=historical.map(d=>d.orders), n=historical.length;
    const linRev=fitLinear(revVals), holtRev=fitHolt(revVals), maRev=fitMA(revVals);
    const linNet=fitLinear(netVals), holtNet=fitHolt(netVals), maNet=fitMA(netVals);
    const linOrd=fitLinear(ordVals), holtOrd=fitHolt(ordVals), maOrd=fitMA(ordVals);
    const annualProjections=[365,730,1825].map(days=>{
        const lR=predictLinear(linRev,n,days),hR=predictHolt(holtRev,days),mR=predictMA(maRev,days);
        const lN=predictLinear(linNet,n,days),hN=predictHolt(holtNet,days),mN=predictMA(maNet,days);
        return{days,gross:{linear:Math.round(sum(lR)),ema:Math.round(sum(hR)),ma:Math.round(sum(mR))},net:{linear:Math.round(sum(lN)),ema:Math.round(sum(hN)),ma:Math.round(sum(mN))}};
    });
    const trendPct=revVals.length>7?((revVals.slice(-7).reduce((a,b)=>a+b,0)/7)-(revVals.slice(0,7).reduce((a,b)=>a+b,0)/7))/(revVals.slice(0,7).reduce((a,b)=>a+b,0)/7||1):0;
    const best=Object.entries({linearRegression:linRev.rmse,exponentialSmoothing:holtRev.rmse,movingAverage:maRev.rmse}).sort((a,b)=>a[1]-b[1])[0][0];
    return { historical, linRev, holtRev, maRev, linNet, holtNet, maNet, linOrd, holtOrd, maOrd, annualProjections, best, trendPct };
}

// ─── Fetch + COGS from DB ─────────────────────────────────────────────────────

async function fetchHistorical(matchFilter) {
    const until = new Date(); until.setHours(23,59,59,999);
    const since = new Date(); since.setMonth(since.getMonth()-18); since.setHours(0,0,0,0);
    const dateFilter = { date:{$gte:since,$lte:until} };

    const [rawDaily, dailyItemsAgg] = await Promise.all([
        Order.aggregate([{$match:{...dateFilter,...matchFilter}},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},revenue:{$sum:{$ifNull:["$total",0]}},orders:{$sum:1}}},{$project:{_id:0,date:"$_id",revenue:1,orders:1}},{$sort:{date:1}}]),
        Items.aggregate([{$match:{...dateFilter,canceled:{$ne:true}}},{$group:{_id:{date:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},styleCode:"$styleCode",sizeName:"$sizeName"},qty:{$sum:1}}},{$project:{_id:0,date:"$_id.date",styleCode:"$_id.styleCode",sizeName:"$_id.sizeName",qty:1}}]),
    ]);

    const styleCodes=[...new Set(dailyItemsAgg.map(r=>r.styleCode).filter(Boolean))];
    const styles=styleCodes.length?await Blank.find({code:{$in:styleCodes}}).select("code sizes").lean():[];
    const costMap={};
    for(const s of styles){costMap[s.code]={};for(const sz of s.sizes??[])costMap[s.code][sz.name]=sz.wholesaleCost??0;}
    const cogsByDate={};
    for(const r of dailyItemsAgg){const cost=costMap[r.styleCode]?.[r.sizeName]??0;cogsByDate[r.date]=(cogsByDate[r.date]||0)+cost*r.qty;}

    return fillDays(since, until, rawDaily).map(d=>({...d,cogs:cogsByDate[d.date]||0,net:Math.max(0,d.revenue-(cogsByDate[d.date]||0))}));
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const marketplace = searchParams.get("marketplace");
        const horizon = Math.min(1825, Math.max(7, parseInt(searchParams.get("horizon") || "30", 10)));

        if (marketplace && marketplace !== "All") {
            const historical = await fetchHistorical({ canceled:{$ne:true}, refunded:{$ne:true}, marketplace });
            if (historical.length < 14) return NextResponse.json({historical,combined:[],combinedOrders:[],combinedMonthly:[],annualProjections:[],models:{},horizon,minDataWarning:true});
            return NextResponse.json(generateResponse(fitPayload(historical), horizon));
        }

        const cached = await ForecastCache.findOne({ appKey: APP_KEY }).select("-_id -__v -appKey").lean();
        if (!cached) return NextResponse.json({ notReady:true, historical:[], combined:[], combinedOrders:[], combinedMonthly:[], annualProjections:[], models:{}, horizon });

        return NextResponse.json({ ...generateResponse(cached.payload, horizon), computedAt: cached.computedAt });
    } catch(e) {
        console.error("[forecast GET]", e);
        return NextResponse.json({ error:true, msg:e.message, historical:[], combined:[], combinedOrders:[], combinedMonthly:[], annualProjections:[], models:{}, horizon:30 }, { status:500 });
    }
}

export async function POST() {
    try {
        const historical = await fetchHistorical({ canceled:{$ne:true}, refunded:{$ne:true} });
        if (historical.length < 14) return NextResponse.json({ ok:false, msg:"Not enough data" });
        const payload = fitPayload(historical);
        const computedAt = new Date();
        await ForecastCache.findOneAndUpdate(
            { appKey: APP_KEY },
            { appKey: APP_KEY, payload, computedAt },
            { upsert: true, new: true }
        );
        return NextResponse.json({ ok: true, computedAt });
    } catch(e) {
        console.error("[forecast POST]", e);
        return NextResponse.json({ error:true, msg:e.message }, { status:500 });
    }
}
