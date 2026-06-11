import axios from "axios";
import xml2js from "xml2js";

const ENDPOINT    = "https://ws.sanmar.com:8080/SanMarWebService/SanMarPOServicePort";
const SHIP_METHOD = "UPS"; // default; >200 lbs must be Truck

/**
 * Validates a PO without submitting it.
 * lineItems = [{ style, color, size, inventoryKey, sizeIndex, qty, warehouse }]
 * shipTo    = { name, address1, address2, city, state, zip, country }
 * credentials = { customerNumber, userName, password }
 */
export async function preSubmitPO(poNumber, lineItems, shipTo, credentials = {}) {
    return _callPO("getPreSubmitInfo", poNumber, lineItems, shipTo, credentials);
}

/**
 * Submits a purchase order to SanMar.
 * Returns { error, message, sanmarPONumber }
 */
export async function submitPO(poNumber, lineItems, shipTo, credentials = {}) {
    return _callPO("submitPO", poNumber, lineItems, shipTo, credentials);
}

async function _callPO(method, poNumber, lineItems, shipTo, credentials) {
    const creds = {
        customerNumber: credentials.customerNumber || process.env.sanmarAccount,
        userName:       credentials.userName       || process.env.sanmarUserName,
        password:       credentials.password       || process.env.sanmarPassword,
    };

    const lineItemXml = lineItems.map((item, idx) => `
        <lineItem>
            <lineNumber>${idx + 1}</lineNumber>
            <style>${item.style}</style>
            ${item.color        ? `<color>${item.color}</color>`                     : ""}
            ${item.size         ? `<size>${item.size}</size>`                        : ""}
            ${item.inventoryKey ? `<inventoryKey>${item.inventoryKey}</inventoryKey>` : ""}
            ${item.sizeIndex    ? `<sizeIndex>${item.sizeIndex}</sizeIndex>`         : ""}
            <qty>${item.qty}</qty>
            <shipMethod>${item.shipMethod || SHIP_METHOD}</shipMethod>
            <warehouse>${item.warehouse || 0}</warehouse>
        </lineItem>`).join("");

    const xml = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:impl="http://impl.webservice.integration.sanmar.com/">
            <soapenv:Header/>
            <soapenv:Body>
                <impl:${method}>
                    <arg0>
                        <customerPO>${poNumber}</customerPO>
                        <shipTo>
                            <name>${shipTo.name || ""}</name>
                            <address1>${shipTo.address1 || ""}</address1>
                            ${shipTo.address2 ? `<address2>${shipTo.address2}</address2>` : ""}
                            <city>${shipTo.city || ""}</city>
                            <state>${shipTo.state || ""}</state>
                            <zip>${shipTo.zip || ""}</zip>
                            <country>${shipTo.country || "US"}</country>
                        </shipTo>
                        <lineItems>${lineItemXml}</lineItems>
                    </arg0>
                    <arg1>
                        <sanMarCustomerNumber>${creds.customerNumber}</sanMarCustomerNumber>
                        <sanMarUserName>${creds.userName}</sanMarUserName>
                        <sanMarUserPassword>${creds.password}</sanMarUserPassword>
                        <senderId>?</senderId>
                        <senderPassword>?</senderPassword>
                    </arg1>
                </impl:${method}>
            </soapenv:Body>
        </soapenv:Envelope>`;

    const res = await axios.post(ENDPOINT, xml, { headers: { "Content-Type": "text/xml" } });
    const parser = new xml2js.Parser({ arrayNotation: false, alternateTextNode: true, trim: true });
    const data = await parser.parseStringPromise(res.data);

    const body = data["S:Envelope"]?.["S:Body"]?.[0];
    const ret  = body?.[`ns2:${method}Response`]?.[0]?.["return"]?.[0];

    const errorOccurred = ret?.["errorOccurred"]?.[0] === "true" || ret?.["errorOccured"]?.[0] === "true";
    const message       = ret?.["message"]?.[0] || "";

    return {
        error:         errorOccurred,
        message,
        sanmarPONumber: errorOccurred ? null : (ret?.["sanMarPONumber"]?.[0] || poNumber),
    };
}
