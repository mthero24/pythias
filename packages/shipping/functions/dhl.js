import axios from "axios";

const BASE = "https://express.api.dhl.com";

function getHeaders(credentials) {
    return {
        Authorization: `Basic ${credentials.basic}`,
        "Content-Type": "application/json",
    };
}

function toKg(oz) { return Math.max(0.1, oz / 35.274); }
function toCm(inches) { return Math.max(1, inches * 2.54); }

function shippingDate() {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().replace(/\.\d{3}Z$/, " GMT+00:00");
}

export async function getRatesDHL({ address, businessAddress, weight, credentials, dimensions }) {
    const params = {
        accountNumber: credentials.accountNumber,
        originCountryCode: businessAddress.country || "US",
        originCityName: businessAddress.city,
        originPostalCode: businessAddress.postalCode || businessAddress.zip,
        destinationCountryCode: address.country || "US",
        destinationCityName: address.city,
        destinationPostalCode: address.zip,
        weight: toKg(weight).toFixed(3),
        length: toCm(dimensions?.length || 10).toFixed(1),
        width: toCm(dimensions?.width || 8).toFixed(1),
        height: toCm(dimensions?.height || 2).toFixed(1),
        plannedShippingDateAndTime: shippingDate(),
        isCustomsDeclarable: false,
        unitOfMeasurement: "metric",
        nextBusinessDay: false,
    };

    let resData;
    const res = await axios.get(`${BASE}/mydhlapi/rates`, {
        params,
        headers: getHeaders(credentials),
    }).catch(e => { console.log("DHL rates error:", e?.response?.data); resData = e?.response?.data; });

    if (!res) return { error: true, msg: resData?.detail || "DHL rates request failed" };

    const products = res.data.products || [];
    if (!products.length) return { error: true, msg: "No DHL rates available for this route" };

    const product = products.reduce((best, p) => {
        const price = p.totalPrice?.find(tp => tp.currencyType === "BILLC")?.price ?? Infinity;
        const bestPrice = best.totalPrice?.find(tp => tp.currencyType === "BILLC")?.price ?? Infinity;
        return price < bestPrice ? p : best;
    }, products[0]);

    const rate = product.totalPrice?.find(tp => tp.currencyType === "BILLC")?.price;
    return { error: false, rate, productCode: product.productCode, productName: product.productName };
}

export async function purchaseDHLLabel({ address, businessAddress, weight, dimensions, selectedShipping, credentials, imageFormat, dpi }) {
    const body = {
        plannedShippingDateAndTime: shippingDate(),
        pickup: { isRequested: false },
        productCode: selectedShipping.name || "N",
        accounts: [{ typeCode: "shipper", number: credentials.accountNumber }],
        customerDetails: {
            shipperDetails: {
                postalAddress: {
                    postalCode: businessAddress.postalCode || businessAddress.zip,
                    cityName: businessAddress.city,
                    countryCode: businessAddress.country || "US",
                    addressLine1: businessAddress.addressLine1 || businessAddress.address1,
                    addressLine2: businessAddress.addressLine2 || businessAddress.address2 || undefined,
                    stateOrProvinceCode: businessAddress.state,
                },
                contactInformation: {
                    fullName: businessAddress.name || "Shipper",
                    phone: businessAddress.phoneNumber || "0000000000",
                    email: businessAddress.email || "noreply@example.com",
                    companyName: businessAddress.name || "Company",
                },
                typeCode: "business",
            },
            receiverDetails: {
                postalAddress: {
                    postalCode: address.zip,
                    cityName: address.city,
                    countryCode: address.country || "US",
                    addressLine1: address.address1,
                    addressLine2: address.address2 || undefined,
                    stateOrProvinceCode: address.state,
                },
                contactInformation: {
                    fullName: address.name || "Recipient",
                    phone: address.phoneNumber || "0000000000",
                    email: address.email || "noreply@example.com",
                },
                typeCode: "private",
            },
        },
        content: {
            packages: [{
                weight: parseFloat(toKg(weight).toFixed(3)),
                dimensions: {
                    length: parseFloat(toCm(dimensions?.length || 10).toFixed(1)),
                    width: parseFloat(toCm(dimensions?.width || 8).toFixed(1)),
                    height: parseFloat(toCm(dimensions?.height || 2).toFixed(1)),
                },
            }],
            isCustomsDeclarable: false,
            description: "Printed goods",
            unitOfMeasurement: "metric",
            declaredValue: 25,
            declaredValueCurrency: "USD",
            incoterm: "DAP",
        },
        outputImageProperties: {
            printerDPI: dpi || 300,
            encodingFormat: imageFormat ? "pdf" : "zpl2",
            imageOptions: [{ typeCode: "label", templateName: imageFormat ? "ECOM26_84_001" : "ECOM26_84_ZPL_001" }],
        },
    };

    let resData;
    const res = await axios.post(`${BASE}/mydhlapi/shipments`, body, {
        headers: getHeaders(credentials),
    }).catch(e => { console.log("DHL shipment error:", e?.response?.data); resData = e?.response?.data; });

    if (!res) return { error: true, msg: resData?.detail || "DHL shipment creation failed" };

    const trackingNumber = res.data.shipmentTrackingNumber;
    const label = res.data.packages?.[0]?.documents?.find(d => d.typeCode === "label")?.content;
    const cost = res.data.shipmentCharges?.find(c => c.currencyType === "BILLC")?.price;

    return { trackingNumber, label, cost };
}

export async function TrackPackageDHL({ tn, credentials }) {
    const res = await axios.get(`${BASE}/mydhlapi/tracking`, {
        params: { shipmentTrackingNumbers: tn },
        headers: getHeaders(credentials),
    }).catch(e => { console.log("DHL tracking error:", e?.response?.data); });

    if (!res) return { events: [], expectedDelivery: null };

    const shipment = res.data.shipments?.[0];
    if (!shipment) return { events: [], expectedDelivery: null };

    const events = (shipment.events || []).map(e => e.description).filter(Boolean);
    const expectedDelivery = shipment.estimatedDeliveryDate ?? null;

    return { events, expectedDelivery };
}
