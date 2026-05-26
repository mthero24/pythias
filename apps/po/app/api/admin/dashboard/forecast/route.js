import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import StyleV2 from "@/models/StyleV2";
import ForecastCache from "@/models/ForecastCache";
import { Design, LicenseHolders, ServiceInvoicePo, KlingInvoicePo } from "@pythias/mongo";

function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function buildInvoiceCostByDate(invoices, since, until) {
    const byDate = {};
    const cur = new Date(since); cur.setDate(1); cur.setHours(0,0,0,0);
    const end = new Date(until);
    while (cur <= end) {
        const y = cur.getFullYear(), m = cur.getMonth() + 1;
        const inv = invoices.find(i => i.year === y && i.month === m);
        if (inv?.totalAmount) {
            const days = daysInMonth(y, m);
            const costPerDay = inv.totalAmount / days;
            const monthStart = new Date(y, m - 1, 1);
            const monthEnd   = new Date(y, m, 0);
            const rangeStart = monthStart > since ? monthStart : since;
            const rangeEnd   = monthEnd   < until  ? monthEnd  : until;
            const d = new Date(rangeStart);
            while (d <= rangeEnd) {
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                byDate[key] = (byDate[key] || 0) + costPerDay;
                d.setDate(d.getDate() + 1);
            }
        }
        cur.setMonth(cur.getMonth() + 1);
    }
    return byDate;
}

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
        if (!map[m]) map[m] = { date: m, _hasActual: false, actual: 0, actualNet: 0, linear: 0, ema: 0, ma: 0, chronos: 0, prophet: 0, linearNet: 0, emaNet: 0, maNet: 0, chronosNet: 0, prophetNet: 0 };
        const e = map[m];
        if (r.actual != null) { e.actual += r.actual; e.actualNet += (r.actualNet ?? 0); e._hasActual = true; }
        e.linear += r.linear || 0; e.ema += r.ema || 0; e.ma += r.ma || 0;
        e.linearNet += r.linearNet || 0; e.emaNet += r.emaNet || 0; e.maNet += r.maNet || 0;
        e.chronos += r.chronos || 0; e.chronosNet += r.chronosNet || 0;
        e.prophet += r.prophet || 0; e.prophetNet += r.prophetNet || 0;
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

function generateResponse(payload, horizon) {
    const { historical, linRev, holtRev, maRev, linNet, holtNet, maNet, linOrd, holtOrd, maOrd, annualProjections, best, trendPct, chronos, prophet } = payload;
    if (!historical || historical.length < 14) return { historical:historical||[], combined:[], combinedOrders:[], combinedMonthly:[], annualProjections:[], models:{}, horizon, minDataWarning:true };

    const n = historical.length;
    const lastDate = new Date(historical[n-1].date);
    const forecastDates = Array.from({length:horizon},(_,h)=>{ const d=new Date(lastDate); d.setDate(d.getDate()+h+1); return isoDate(d); });

    const lRF=predictLinear(linRev,n,horizon), hRF=predictHolt(holtRev,horizon), mRF=predictMA(maRev,horizon);
    const lNF=predictLinear(linNet,n,horizon), hNF=predictHolt(holtNet,horizon), mNF=predictMA(maNet,horizon);
    const lOF=predictLinear(linOrd,n,horizon), hOF=predictHolt(holtOrd,horizon), mOF=predictMA(maOrd,horizon);

    const maxProj = Math.max(horizon, 365);
    const lOFP=predictLinear(linOrd,n,maxProj), hOFP=predictHolt(holtOrd,maxProj), mOFP=predictMA(maOrd,maxProj);
    const lRFP=predictLinear(linRev,n,maxProj), hRFP=predictHolt(holtRev,maxProj), mRFP=predictMA(maRev,maxProj);
    const PROJ_BUCKETS = { week:7, month:30, quarter:90, year:365 };
    const makeProj = (ordArr, revArr) => Object.fromEntries(Object.entries(PROJ_BUCKETS).map(([k,d]) => [k, { orders: Math.round(sum(ordArr.slice(0,d))), revenue: Math.round(sum(revArr.slice(0,d))) }]));
    const projections = { linear: makeProj(lOFP,lRFP), ema: makeProj(hOFP,hRFP), ma: makeProj(mOFP,mRFP) };
    if (chronos) projections.chronos = makeProj(chronos.ord.median.slice(0,maxProj), chronos.rev.median.slice(0,maxProj));
    if (prophet) projections.prophet = makeProj(prophet.ord.forecast.slice(0,maxProj), prophet.rev.forecast.slice(0,maxProj));

    const combined = [
        ...historical.map((d,i)=>{ const linear=Math.round(Math.max(0,linRev.intercept+linRev.slope*i)),ema=Math.round(holtRev.fitted[i]),ma=Math.round(maRev.fitted[i]); return {date:d.date,actual:d.revenue,actualNet:d.net,linear,ema,ma,chronos:null,prophet:null,linearNet:Math.min(linear,Math.round(Math.max(0,linNet.intercept+linNet.slope*i))),emaNet:Math.min(ema,Math.round(holtNet.fitted[i])),maNet:Math.min(ma,Math.round(maNet.fitted[i])),chronosNet:null,prophetNet:null}; }),
        ...forecastDates.map((date,h)=>{ const linear=Math.round(lRF[h]),ema=Math.round(hRF[h]),ma=Math.round(mRF[h]); const chr=chronos?Math.round(Math.max(0,chronos.rev.median[h]??0)):null,chrN=chronos?Math.round(Math.max(0,chronos.net.median[h]??0)):null; const pro=prophet?Math.round(Math.max(0,prophet.rev.forecast[h]??0)):null,proN=prophet?Math.round(Math.max(0,prophet.net.forecast[h]??0)):null; return {date,actual:null,actualNet:null,linear,ema,ma,chronos:chr,prophet:pro,linearNet:Math.min(linear,Math.round(lNF[h])),emaNet:Math.min(ema,Math.round(hNF[h])),maNet:Math.min(ma,Math.round(mNF[h])),chronosNet:chrN,prophetNet:proN}; }),
    ];
    const combinedOrders = [
        ...historical.map((d,i)=>({date:d.date,actual:d.orders,linear:Math.max(0,Math.round(linOrd.intercept+linOrd.slope*i)),ema:Math.max(0,Math.round(holtOrd.fitted[i])),ma:Math.max(0,Math.round(maOrd.fitted[i])),chronos:null,prophet:null})),
        ...forecastDates.map((date,h)=>({date,actual:null,linear:Math.max(0,Math.round(lOF[h])),ema:Math.max(0,Math.round(hOF[h])),ma:Math.max(0,Math.round(mOF[h])),chronos:chronos?Math.round(Math.max(0,chronos.ord.median[h]??0)):null,prophet:prophet?Math.round(Math.max(0,prophet.ord.forecast[h]??0)):null})),
    ];
    const combinedMonthly = groupByMonth(combined);
    const models = {
        linearRegression:     { label:"Linear Regression",     color:"#e65100", rmseRev:Math.round(linRev.rmse),  forecastTotal:Math.round(sum(lRF)), forecastOrders:Math.round(sum(lOF)) },
        exponentialSmoothing: { label:"Exp. Smoothing (Holt)", color:"#7b1fa2", rmseRev:Math.round(holtRev.rmse), forecastTotal:Math.round(sum(hRF)), forecastOrders:Math.round(sum(hOF)) },
        movingAverage:        { label:"Moving Average",        color:"#2e7d32", rmseRev:Math.round(maRev.rmse),   forecastTotal:Math.round(sum(mRF)), forecastOrders:Math.round(sum(mOF)) },
    };
    if (chronos) {
        models.chronos = { label:"Chronos (AI)", color:"#0277bd", rmseRev:chronos.rev.rmse!=null?Math.round(chronos.rev.rmse):null, forecastTotal:Math.round(sum(chronos.rev.median.slice(0,horizon))), forecastOrders:Math.round(sum(chronos.ord.median.slice(0,horizon))) };
    }
    if (prophet) {
        models.prophet = { label:"Prophet (Seasonal)", color:"#c62828", rmseRev:prophet.rev.rmse!=null?Math.round(prophet.rev.rmse):null, forecastTotal:Math.round(sum(prophet.rev.forecast.slice(0,horizon))), forecastOrders:Math.round(sum(prophet.ord.forecast.slice(0,horizon))) };
    }
    return { historical, combined, combinedOrders, combinedMonthly, annualProjections, projections, models, best, horizon, trendPct };
}

function fitPayload(historical) {
    const revVals=historical.map(d=>d.revenue), netVals=historical.map(d=>d.net), ordVals=historical.map(d=>d.orders), n=historical.length;
    const linRev=fitLinear(revVals), holtRev=fitHolt(revVals), maRev=fitMA(revVals);
    const linNet=fitLinear(netVals), holtNet=fitHolt(netVals), maNet=fitMA(netVals);
    const linOrd=fitLinear(ordVals), holtOrd=fitHolt(ordVals), maOrd=fitMA(ordVals);
    const lRevFull=predictLinear(linRev,n,1825),hRevFull=predictHolt(holtRev,1825),mRevFull=predictMA(maRev,1825);
    const lNetFull=predictLinear(linNet,n,1825),hNetFull=predictHolt(holtNet,1825),mNetFull=predictMA(maNet,1825);
    const annualProjections=[{days:365,from:0},{days:730,from:365},{days:1825,from:1460}].map(({days,from})=>{
        const gL=Math.round(sum(lRevFull.slice(from,days))),gE=Math.round(sum(hRevFull.slice(from,days))),gM=Math.round(sum(mRevFull.slice(from,days)));
        return{days,from,gross:{linear:gL,ema:gE,ma:gM},net:{linear:Math.min(gL,Math.round(sum(lNetFull.slice(from,days)))),ema:Math.min(gE,Math.round(sum(hNetFull.slice(from,days)))),ma:Math.min(gM,Math.round(sum(mNetFull.slice(from,days))))}};
    });
    const recentAvg=revVals.slice(-30).reduce((a,b)=>a+b,0)/Math.min(30,revVals.length); const priorSlice=revVals.slice(-60,-30); const priorAvg=priorSlice.length?priorSlice.reduce((a,b)=>a+b,0)/priorSlice.length:0; const trendPct=priorAvg>1?(recentAvg-priorAvg)/priorAvg:0;
    const best=Object.entries({linearRegression:linRev.rmse,exponentialSmoothing:holtRev.rmse,movingAverage:maRev.rmse}).sort((a,b)=>a[1]-b[1])[0][0];
    return { historical, linRev, holtRev, maRev, linNet, holtNet, maNet, linOrd, holtOrd, maOrd, annualProjections, best, trendPct };
}

// ─── Chronos sidecar ─────────────────────────────────────────────────────────

async function callChronos(historical) {
    try {
        const res = await fetch("http://127.0.0.1:5050/forecast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dates: historical.map(d=>d.date), rev: historical.map(d=>d.revenue), net: historical.map(d=>d.net), ord: historical.map(d=>d.orders), horizon: 1825 }),
            signal: AbortSignal.timeout(180000),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch(e) {
        console.warn("[forecast] Sidecar unavailable:", e.message);
        return null;
    }
}

async function augmentWithChronos(payload, historical) {
    const result = await callChronos(historical);
    if (!result) return payload;
    if (result.rev)         { payload.chronos = { rev: result.rev, net: result.net, ord: result.ord }; }
    if (result.prophet_rev) { payload.prophet = { rev: result.prophet_rev, net: result.prophet_net, ord: result.prophet_ord }; }
    for (const proj of payload.annualProjections) {
        const f = proj.from ?? 0;
        if (result.rev)         { proj.gross.chronos = Math.round(sum(result.rev.median.slice(f, proj.days)));         proj.net.chronos = Math.round(sum(result.net.median.slice(f, proj.days))); }
        if (result.prophet_rev) { proj.gross.prophet = Math.round(sum(result.prophet_rev.forecast.slice(f, proj.days))); proj.net.prophet = Math.round(sum(result.prophet_net.forecast.slice(f, proj.days))); }
    }
    const rmses = { linearRegression: payload.linRev.rmse, exponentialSmoothing: payload.holtRev.rmse, movingAverage: payload.maRev.rmse };
    if (result.rev?.rmse         != null) rmses.chronos = result.rev.rmse;
    if (result.prophet_rev?.rmse != null) rmses.prophet = result.prophet_rev.rmse;
    payload.best = Object.entries(rmses).filter(([,v]) => v != null).sort((a,b) => a[1]-b[1])[0][0];
    return payload;
}

// ─── Fetch + COGS from DB ─────────────────────────────────────────────────────

async function fetchHistorical(extraMatch) {
    const until = new Date(); until.setHours(23,59,59,999);
    const since = new Date(); since.setMonth(since.getMonth()-18); since.setHours(0,0,0,0);
    const dateFilter = { date:{$gte:since,$lte:until} };

    const [rawDaily, dailyItemsAgg, licencedItemsAgg, serviceInvoices, klingInvoices] = await Promise.all([
        Order.aggregate([{$match:{...dateFilter,...extraMatch}},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},revenue:{$sum:{$subtract:[{$add:[{$ifNull:["$productCost",0]},{$ifNull:["$shippingCost",0]}]},{$ifNull:["$discountAmount",0]}]}},shippingPaid:{$sum:{$ifNull:["$shippingInfo.shippingCost",0]}},orders:{$sum:1}}},{$project:{_id:0,date:"$_id",revenue:1,shippingPaid:1,orders:1}},{$sort:{date:1}}]),
        Items.aggregate([{$match:{...dateFilter,canceled:{$ne:true}}},{$group:{_id:{date:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},styleCode:"$styleCode",sizeName:"$sizeName"},qty:{$sum:1}}},{$project:{_id:0,date:"$_id.date",styleCode:"$_id.styleCode",sizeName:"$_id.sizeName",qty:1}}]),
        Items.aggregate([{$match:{...dateFilter,designRef:{$ne:null},canceled:{$ne:true}}},{$group:{_id:{date:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},designRef:{$toString:"$designRef"},styleCode:"$styleCode",sizeName:"$sizeName"},qty:{$sum:1},totalPrice:{$sum:{$ifNull:["$price",0]}}}},{$project:{_id:0,date:"$_id.date",designRef:"$_id.designRef",styleCode:"$_id.styleCode",sizeName:"$_id.sizeName",qty:1,totalPrice:1}}]),
        ServiceInvoicePo.find({ year: { $gte: since.getFullYear(), $lte: until.getFullYear() } }).lean(),
        KlingInvoicePo.find({ year: { $gte: since.getFullYear(), $lte: until.getFullYear() } }).lean(),
    ]);

    const styleCodes=[...new Set(dailyItemsAgg.map(r=>r.styleCode).filter(Boolean))];
    const styles=styleCodes.length?await StyleV2.find({code:{$in:styleCodes}}).select("code sizes").lean():[];
    const costMap={};
    for(const s of styles){costMap[s.code]={};for(const sz of s.sizes??[])costMap[s.code][sz.name]=sz.wholesaleCost??0;}
    const cogsByDate={};
    for(const r of dailyItemsAgg){const cost=costMap[r.styleCode]?.[r.sizeName]??0;cogsByDate[r.date]=(cogsByDate[r.date]||0)+cost*r.qty;}

    const licenceFeeByDate={};
    if(licencedItemsAgg.length){
        const designIds=[...new Set(licencedItemsAgg.map(r=>r.designRef).filter(Boolean))];
        const designs=await Design.find({_id:{$in:designIds},licenseHolder:{$ne:null}}).select("_id licenseHolder").lean();
        if(designs.length){
            const holderIds=[...new Set(designs.map(d=>d.licenseHolder).filter(Boolean).map(String))];
            const holders=await LicenseHolders.find({_id:{$in:holderIds}}).lean();
            const holderMap=Object.fromEntries(holders.map(h=>[String(h._id),h]));
            const designHolderMap={};
            for(const d of designs){if(d.licenseHolder)designHolderMap[String(d._id)]=holderMap[String(d.licenseHolder)];}
            const licStyleCodes=[...new Set(licencedItemsAgg.map(r=>r.styleCode).filter(Boolean))];
            const licStyles=licStyleCodes.length?await StyleV2.find({code:{$in:licStyleCodes}}).select("code sizes").lean():[];
            const retailMap={};
            for(const s of licStyles){retailMap[s.code]={};for(const sz of s.sizes??[])retailMap[s.code][sz.name]=sz.retailPrice??0;}
            for(const r of licencedItemsAgg){
                const holder=designHolderMap[r.designRef];
                if(!holder)continue;
                const avgPrice=r.qty>0?r.totalPrice/r.qty:0;
                const basePrice=avgPrice||retailMap[r.styleCode]?.[r.sizeName]||0;
                const adjPrice=basePrice+(holder.additionalFees||0);
                const feePerUnit=adjPrice*(holder.paymentType==="Percentage Per Unit"?(holder.amount/100):1)+(holder.paymentType==="Flat Per Unit"||holder.paymentType==="One Time"?holder.amount:0);
                licenceFeeByDate[r.date]=(licenceFeeByDate[r.date]||0)+feePerUnit*r.qty;
            }
        }
    }

    const servicesCostByDate = buildInvoiceCostByDate(serviceInvoices, since, until);
    const klingCostByDate    = buildInvoiceCostByDate(klingInvoices, since, until);
    return fillDays(since, until, rawDaily).map(d=>({...d,cogs:cogsByDate[d.date]||0,net:Math.max(0,d.revenue-(cogsByDate[d.date]||0)-(licenceFeeByDate[d.date]||0)-(d.shippingPaid||0)-(servicesCostByDate[d.date]||0)-(klingCostByDate[d.date]||0))}));
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const marketplace = searchParams.get("marketplace");
        const horizon = Math.min(1825, Math.max(7, parseInt(searchParams.get("horizon") || "30", 10)));

        if (marketplace && marketplace !== "All") {
            const historical = await fetchHistorical({ canceled:{$ne:true}, refunded:{$ne:true}, marketplace });
            if (historical.length < 14) return NextResponse.json({historical,combined:[],combinedOrders:[],combinedMonthly:[],annualProjections:[],models:{},horizon,minDataWarning:true});
            const payload = await augmentWithChronos(fitPayload(historical), historical);
            return NextResponse.json(generateResponse(payload, horizon));
        }

        const cached = await ForecastCache.findOne().select("-_id -__v").lean();
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
        const payload = await augmentWithChronos(fitPayload(historical), historical);
        const computedAt = new Date();
        await ForecastCache.findOneAndUpdate({}, { payload, computedAt }, { upsert: true, new: true });
        return NextResponse.json({ ok: true, computedAt });
    } catch(e) {
        console.error("[forecast POST]", e);
        return NextResponse.json({ error:true, msg:e.message }, { status:500 });
    }
}
