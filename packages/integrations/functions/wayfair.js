import axios from "axios";

// Wayfair Supplier API — GraphQL
// Token URL confirmed from docs: https://sso.auth.wayfair.com/oauth/token
const TOKEN_URL = "https://sso.auth.wayfair.com/oauth/token";
const BASE_URL  = "https://api.wayfair.com/v1/graphql";

const getWayfairToken = async (credentials) => {
    const res = await axios.post(TOKEN_URL, {
        grant_type: "client_credentials",
        client_id: credentials.apiKey,
        client_secret: credentials.apiSecret,
        audience: "https://api.wayfair.com/",
    }, { headers: { "Content-Type": "application/json" } });
    return res.data.access_token;
};

const wayfairQuery = async (query, variables, credentials) => {
    const token = await getWayfairToken(credentials);
    try {
        const res = await axios.post(BASE_URL, { query, variables }, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (res.data.errors?.length) throw new Error(res.data.errors[0].message);
        return res.data.data;
    } catch (e) {
        const msg = e.response?.data?.errors?.[0]?.message ?? e.message;
        throw new Error(`Wayfair GraphQL: ${msg}`);
    }
};

export const getWayfairOrders = async (credentials, after) => {
    const query = `
        query GetPOs($first: Int!, $after: String) {
            purchaseOrders(hasResponse: false, first: $first, after: $after) {
                edges {
                    node {
                        poNumber
                        poDate
                        customerName
                        customerEmail
                        customerPhone
                        shippingInfo { shipSpeed carrierCode }
                        shippingAddress { address1 address2 city state postalCode country }
                        lineItems { partNumber quantity unitPrice estimatedShipDate }
                    }
                    cursor
                }
                pageInfo { hasNextPage endCursor }
            }
        }
    `;
    const data = await wayfairQuery(query, { first: 100, after: after ?? null }, credentials);
    return {
        orders: (data?.purchaseOrders?.edges ?? []).map(e => e.node),
        pageInfo: data?.purchaseOrders?.pageInfo ?? {},
    };
};

export const acceptWayfairOrder = async (poNumber, lineItems, credentials) => {
    const query = `
        mutation AcceptPO($poNumber: String!, $lineItems: [LineItemInput!]!) {
            purchaseOrders {
                accept(poNumber: $poNumber, lineItems: $lineItems) {
                    handle success
                    errors { message code }
                }
            }
        }
    `;
    return await wayfairQuery(query, {
        poNumber,
        lineItems: lineItems.map(li => ({
            partNumber: li.partNumber,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            estimatedShipDate: li.estimatedShipDate,
        })),
    }, credentials);
};

export const shipWayfairOrder = async (poNumber, supplierId, trackingNumber, carrierCode, shipSpeed, credentials) => {
    const query = `
        mutation ShipPO($input: ShipmentInput!) {
            shipment(input: $input) {
                handle submittedAt
                errors { message code }
            }
        }
    `;
    return await wayfairQuery(query, {
        input: { poNumber, supplierId, trackingNumber, carrierCode, shipSpeed, packageCount: 1 },
    }, credentials);
};
