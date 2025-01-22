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
                        <PassPhrase>${enSettings.PassPhrase}</PassPhrase>
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

export async function getRatesEn({address, weight, businessAddress, service, enSettings}){
    console.log(enSettings)
    let xml = `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
        <CalculatePostageRate xmlns="www.envmgr.com/LabelService">
        <PostageRateRequest ResponseVersion="1">
        <MailpieceShape>Parcel</MailpieceShape>
        <MailClass>${service}</MailClass>
        <WeightOz>${parseFloat(weight).toFixed(1)}</WeightOz>
        <Extension>5868767931</Extension>
        <MailpieceDimensions>
        <Length>8</Length>
        <Width>8</Width>
        <Height>1</Height>
        </MailpieceDimensions>
        <RequesterID>${enSettings.requesterID}</RequesterID>
        <CertifiedIntermediary>
        <AccountID>${enSettings.accountNumber}</AccountID>
        <PassPhrase>${enSettings.passPhrase}</PassPhrase>
        </CertifiedIntermediary>
        <Machinable>True</Machinable>
        <Value>10</Value>
        <FromPostalCode>${businessAddress.postalCode}</FromPostalCode>
        <ToPostalCode>${address.zip.split("-")[0]}</ToPostalCode>
        <ToCountryCode>${address.country}</ToCountryCode>
        <ShipDate>${new Date(Date.now()).toLocaleString("en-US")}</ShipDate>
        </PostageRateRequest>
        </CalculatePostageRate>
        </soap:Body>
    </soap:Envelope>`

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
    console.log(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0])
    if(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Status[0] != "0") {
        console.log(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Status[0], "printed")
        return {error: true, msg: data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].ErrorMessage[0]}
    }else{
        return {error: false, rate: data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Postage[0].Rate[0]}
    }
}