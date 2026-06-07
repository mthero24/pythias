import axios from "axios";

const AUTH_BASE = "https://signin.stampsendicia.com";
const API_BASE  = "https://api.stampsendicia.com/sera";

function idempotencyKey() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function getAccessToken(credentials) {
    const res = await axios.post(
        `${AUTH_BASE}/oauth/token`,
        {
            grant_type:    "refresh_token",
            client_id:     credentials.clientId,
            client_secret: credentials.clientSecret,
            refresh_token: credentials.refreshToken,
        },
        { headers: { "Content-Type": "application/json" } }
    );
    return res.data.access_token;
}

function fromAddress(businessAddress) {
    return {
        name:           businessAddress.name || businessAddress.companyName || "",
        company_name:   businessAddress.companyName || businessAddress.name || "",
        address_line1:  businessAddress.address1 || businessAddress.addressLine1 || "",
        address_line2:  businessAddress.address2 || businessAddress.addressLine2 || undefined,
        city:           businessAddress.city,
        state_province: businessAddress.state,
        postal_code:    businessAddress.postalCode || businessAddress.zip,
        country_code:   businessAddress.country || "US",
        phone:          businessAddress.phoneNumber || businessAddress.phone || undefined,
    };
}

function toAddress(address) {
    return {
        name:           address.name,
        address_line1:  address.address1,
        address_line2:  address.address2 || undefined,
        city:           address.city,
        state_province: address.state,
        postal_code:    address.zip?.split("-")[0],
        country_code:   address.country || "US",
    };
}

function buildPackage(weight, dimensions) {
    const pkg = {
        packaging_type: "package",
        weight:         Math.max(0.1, parseFloat(weight)),
        weight_unit:    "ounce",
    };
    if (dimensions?.length) {
        pkg.dimensions = {
            length: dimensions.length,
            width:  dimensions.width,
            height: dimensions.height,
            unit:   "inch",
        };
    }
    return pkg;
}

function labelFormat(imageFormat) {
    if (!imageFormat) return "zpl";
    const fmt = imageFormat.toLowerCase();
    if (fmt === "pdf")  return "pdf";
    if (fmt === "png")  return "png";
    if (fmt === "zpl")  return "zpl";
    return "zpl";
}

export async function getRatesStamps({ address, businessAddress, weight, credentials, dimensions, service }) {
    let token;
    try {
        token = await getAccessToken(credentials);
    } catch (e) {
        console.error("[stamps] auth error:", e.response?.data || e.message);
        return { error: true, msg: "Stamps.com authentication failed" };
    }

    let errData;
    const res = await axios.post(
        `${API_BASE}/v1/rates`,
        {
            from_address: fromAddress(businessAddress),
            to_address:   toAddress(address),
            service_type: service,
            package:      buildPackage(weight, dimensions),
            ship_date:    new Date().toISOString().split("T")[0],
        },
        {
            headers: {
                Authorization:     `Bearer ${token}`,
                "Content-Type":    "application/json",
                "Idempotency-Key": idempotencyKey(),
            },
        }
    ).catch(e => { errData = e.response?.data; console.error("[stamps] rates error:", errData); });

    if (!res) return { error: true, msg: errData?.message || errData?.errors?.[0]?.message || "Stamps.com rates request failed" };

    const data = res.data;
    // Response may be a single rate object or an array
    const rate = Array.isArray(data) ? data[0] : data;
    if (!rate) return { error: true, msg: "No rates returned from Stamps.com" };

    const cost = rate.shipment_cost?.total_amount ?? rate.shipment_cost;
    return { error: false, rate: parseFloat(cost) };
}

export async function buyShippingLabelStamps({ address, poNumber, weight, businessAddress, selectedShipping, credentials, dimensions, imageFormat }) {
    let token;
    try {
        token = await getAccessToken(credentials);
    } catch (e) {
        console.error("[stamps] auth error:", e.response?.data || e.message);
        return { error: true, msg: "Stamps.com authentication failed" };
    }

    let errData;
    const res = await axios.post(
        `${API_BASE}/v1/labels`,
        {
            from_address: fromAddress(businessAddress),
            to_address:   toAddress(address),
            service_type: selectedShipping.name,
            package:      buildPackage(weight, dimensions),
            ship_date:    new Date().toISOString().split("T")[0],
            label_options: {
                label_format:      labelFormat(imageFormat),
                label_output_type: "url",
                label_size:        "4x6",
            },
        },
        {
            headers: {
                Authorization:     `Bearer ${token}`,
                "Content-Type":    "application/json",
                "Idempotency-Key": idempotencyKey(),
            },
        }
    ).catch(e => { errData = e.response?.data; console.error("[stamps] label error:", errData); });

    if (!res) return { error: true, msg: errData?.message || errData?.errors?.[0]?.message || "Stamps.com label purchase failed" };

    const data = res.data;
    if (!data.tracking_number) return { error: true, msg: data.message || "No tracking number in Stamps.com response" };

    // Fetch label from the returned URL and convert to base64
    const labelUrl = data.labels?.[0]?.href;
    let labelBase64 = labelUrl;
    if (labelUrl) {
        const labelRes = await axios.get(labelUrl, { responseType: "arraybuffer" }).catch(() => null);
        if (labelRes) labelBase64 = Buffer.from(labelRes.data).toString("base64");
    }

    return {
        error:          false,
        label:          labelBase64,
        trackingNumber: data.tracking_number,
        cost:           data.shipment_cost?.total_amount ?? data.shipment_cost,
        labelId:        data.label_id,
    };
}

export async function voidStampsLabel({ labelId, credentials }) {
    let token;
    try {
        token = await getAccessToken(credentials);
    } catch (e) {
        return { error: true, msg: "Stamps.com authentication failed" };
    }

    let errData;
    const res = await axios.put(
        `${API_BASE}/v1/labels/${labelId}/void`,
        {},
        {
            headers: {
                Authorization:  `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    ).catch(e => { errData = e.response?.data; });

    if (!res) return { error: true, msg: errData?.message || "Stamps.com void failed" };
    return { error: false };
}
