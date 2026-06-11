import axios from "axios";
import xml2js from "xml2js";

const ENDPOINT = "https://ws.sanmar.com:8080/promostandards/InventoryServiceBinding";

/**
 * Returns available qty per warehouse for a style/color/size combo.
 * credentials = { customerNumber, userName, password }
 * Returns { error, warehouses: { [warehouseId]: qty }, totalQty }
 */
export async function getInventoryQty(style, color, size, inventoryKey, sizeIndex, credentials = {}) {
    const creds = {
        customerNumber: credentials.customerNumber || process.env.sanmarAccount,
        userName:       credentials.userName       || process.env.sanmarUserName,
        password:       credentials.password       || process.env.sanmarPassword,
    };

    const xml = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:impl="http://impl.webservice.integration.sanmar.com/">
            <soapenv:Header/>
            <soapenv:Body>
                <impl:getInventoryQtyForStyleColorSize>
                    <arg0>
                        <style>${style}</style>
                        ${color        ? `<color>${color}</color>`               : ""}
                        ${size         ? `<size>${size}</size>`                  : ""}
                        ${inventoryKey ? `<inventoryKey>${inventoryKey}</inventoryKey>` : ""}
                        ${sizeIndex    ? `<sizeIndex>${sizeIndex}</sizeIndex>`   : ""}
                    </arg0>
                    <arg1>
                        <sanMarCustomerNumber>${creds.customerNumber}</sanMarCustomerNumber>
                        <sanMarUserName>${creds.userName}</sanMarUserName>
                        <sanMarUserPassword>${creds.password}</sanMarUserPassword>
                        <senderId>?</senderId>
                        <senderPassword>?</senderPassword>
                    </arg1>
                </impl:getInventoryQtyForStyleColorSize>
            </soapenv:Body>
        </soapenv:Envelope>`;

    const res = await axios.post(ENDPOINT, xml, { headers: { "Content-Type": "text/xml" } });
    const parser = new xml2js.Parser({ arrayNotation: false, alternateTextNode: true, trim: true });
    const data = await parser.parseStringPromise(res.data);

    const body = data["S:Envelope"]?.["S:Body"]?.[0];
    const ret  = body?.["ns2:getInventoryQtyForStyleColorSizeResponse"]?.[0]?.["return"]?.[0];

    if (!ret || ret["errorOccured"]?.[0] === "true" || ret["errorOccurred"]?.[0] === "true") {
        return { error: true, message: ret?.["message"]?.[0] || "Unknown error", warehouses: {}, totalQty: 0 };
    }

    const warehouses = {};
    let totalQty = 0;
    const invList = ret["inventoryList"]?.[0]?.["Inventory"] || [];
    for (const wh of Array.isArray(invList) ? invList : [invList]) {
        const id  = wh["warehouseId"]?.[0];
        const qty = parseInt(wh["qty"]?.[0] || "0", 10);
        if (id) {
            warehouses[id] = qty;
            totalQty += qty;
        }
    }

    return { error: false, warehouses, totalQty };
}
