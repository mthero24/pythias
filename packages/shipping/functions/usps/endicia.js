import axios from "axios";
var xml2js = require('xml2js');
let options = {
    object: true,
    reversible: false,
    coerce: false,
    sanitize: true,
    trim: true,
    arrayNotation: false,
    alternateTextNode: true
};
export async function GenerateManifest({PicNumbers, enSettings, businessAddress}){
    console.log(PicNumbers,)
    let xml = `
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <GetSCAN xmlns="www.envmgr.com/LabelService">
                <GetSCANRequest>
                    <RequesterID>${enSettings.RequesterID}</RequesterID>
                    <RequestID>19hurt</RequestID>
                    <CertifiedIntermediary>
                        <AccountID>${enSettings.AccountNUmber}</AccountID>
                        <PassPhrase>${enSettings.PassPhrase}</PassPhrase>p>
                    </CertifiedIntermediary>
                    <GetSCANRequestParameters ImageResolution="300" ImageFormat="jpg">
                        <FromName>${businessAddress.name}</FromName>
                        <FromCompany>${businessAddress.companyName}</FromCompany>
                        <FromAddress>${businessAddress.addressLine1}</FromAddress>
                        <FromCity>${businessAddress.city}</FromCity>
                        <FromState>${businessAddress.state}</FromState>
                        <FromZip>${businessAddress.postalCode}</FromZip>
                    </GetSCANRequestParameters>
                    <PicNumbers>
                        ${PicNumbers}
                    </PicNumbers>
                    <ManifestType>USPS</ManifestType>
                    <NumberOfContainerLabels>${1}</NumberOfContainerLabels>
                </GetSCANRequest>
            </GetSCAN>
        </soap:Body>
    </soap:Envelope>
    `
    const headers = {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": xml.length,
            "SaopAction": "www.envmgr.com/LabelService/GetSCAN"
        }
    }
    let res = await axios.post(`https://labelserver.endicia.com/LabelService/EwsLabelService.asmx`, xml, headers)
    var parser = new xml2js.Parser(options);
    console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    console.log(data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0])
    if(data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].ErrorMessage){
        return {error: true, msg: data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].ErrorMessage[0]}
    }else{
        return {error: false, manifest: data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].SCANForm}
    }
    // let scanForm = data
    // console.log(scanForm)
    // return scanForm
} 