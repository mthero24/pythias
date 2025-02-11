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
    //console.log(PicNumbers,)
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
    //console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    //console.log(data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0])
    if(data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].ErrorMessage){
        return {error: true, msg: data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].ErrorMessage[0]}
    }else{
        return {error: false, manifest: data["soap:Envelope"]["soap:Body"][0].GetSCANResponse[0].GetSCANResponse[0].SCANForm}
    }
    // let scanForm = data
    // console.log(scanForm)
    // return scanForm
} 

export async function getRatesEn({address, weight, businessAddress, service, enSettings, dimensions}){
    //console.log(enSettings)
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
        <Length>${dimensions.length}</Length>
        <Width>${dimensions.width}</Width>
        <Height>${dimensions.height}</Height>
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
    //console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    //console.log(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Postage[0])
    if(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Status[0] != "0") {
        console.log(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Status[0], "printed")
        return {error: true, msg: data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].ErrorMessage[0]}
    }else{
        console.log(data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Postage[0])
        return {error: false, rate: data['soap:Envelope']['soap:Body'][0].CalculatePostageRateResponse[0].PostageRateResponse[0].Postage[0].Rate[0]}
    }
}

export async function buyShippingLabelEn({address, poNumber, weight, businessAddress, selectedShipping, enSettings, dimensions, dpi}){
    console.log(weight)
    let itemsxml = ``
    // if(address.country != "US"){
    //     let nonCanceled = 0
    //     for(let item of order.items){
    //         if(!item.canceled) nonCanceled++
    //     }
    //     for(let item of order.items){
    //     // console.log(parseFloat(oz / items.length).toFixed(2))
    //     console.log(!item.canceled)
    //     if(!item.canceled){
    //             itemsxml = `${itemsxml}<CustomsItem>
    //                     <Description>${item.styleCode}</Description>
    //                     <Quantity>${item.quantity}</Quantity>
    //                     <Weight>${parseFloat(weight / nonCanceled).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0] }</Weight>
    //                     <Value>${item.productCost > 0? item.productCost.toFixed(2): 12.99}</Value>
    //                     <CountryOfOrigin>US</CountryOfOrigin>
    //                     <Sku>${item.sku}</Sku>
    //                 </CustomsItem>`
    //             }
    //     }
    // }
    let xml = `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
        <GetPostageLabel xmlns="www.envmgr.com/LabelService">
        <LabelRequest ${address.country == "US"? `ImageFormat="ZPLII" 
                        ImageResolution="${dpi != undefined? 300: 203}">`: `LabelType="International"
                        LabelSubtype="Integrated"
                        LabelSize="4x6"
                        ImageFormat="ZPLII">`}
        <MailpieceShape>Parcel</MailpieceShape>
        <MailClass>${selectedShipping.name}</MailClass>
        <WeightOz>${parseFloat(weight).toFixed(1)}</WeightOz>
        <RequesterID>${enSettings.requesterID}</RequesterID>
        <AccountID>${enSettings.accountNumber}</AccountID>
        <PassPhrase>${enSettings.passPhrase}</PassPhrase>
        <PartnerCustomerID>${poNumber}</PartnerCustomerID>
        <PartnerTransactionID>${poNumber}</PartnerTransactionID>
        <FromCompany>${businessAddress.name.replace(/[^\w\s]/gi, '')}</FromCompany>
        <ReturnAddress1>${businessAddress.address1? businessAddress.address1.replace(/[^\w\s]/gi, ''): businessAddress.addressLine1.replace(/[^\w\s]/gi, '') }</ReturnAddress1>
        ${businessAddress.address2 || businessAddress.addressLine2? `<ReturnAddress2>${business.address2? business.address2.replace(/[^\w\s]/gi, ''): business.addressLine2.replace(/[^\w\s]/gi, '')}</ReturnAddress2>`:""}
        <FromCity>${businessAddress.city.replace(/[^\w\s]/gi, '')}</FromCity>
        <FromState>${businessAddress.state.replace(/[^\w\s]/gi, '')}</FromState>
        <FromPhone>${businessAddress.phoneNumber? businessAddress.phoneNumber.replace(/[^\w\s]/gi, ''): "2485497922"}</FromPhone>
        <FromPostalCode>${businessAddress.zip? businessAddress.zip.replace(/[^\w\s]/gi, ''): businessAddress.postalCode?.replace(/[^\w\s]/gi, '')}</FromPostalCode>
        <FromCountry>${businessAddress.country? businessAddress.country.replace(/[^\w\s]/gi, ''): "US"}</FromCountry>
        <ToName>${address.name.replace(/[^\w\s]/gi, '')}</ToName>
        <ToAddress1>${address.address1.replace(/[^\w\s]/gi, '')}</ToAddress1>
        ${address.address2? `<ToAddress2>${address.address2.replace(/[^\w\s]/gi, '')}</ToAddress2>`: ""}
        <ToCity>${address.city.replace(/[^\w\s]/gi, '')}</ToCity>
        <ToState>${address.state}</ToState>
        <ToPostalCode>${address.zip.split("-")[0].trim()}</ToPostalCode>
        <ToCountryCode>${address.country}</ToCountryCode>
        ${address.country != "US"? `<CustomsInfo>
        <ContentsType>Merchandise</ContentsType>
        <ContentsExplanation>Merchandise</ContentsExplanation>
        <RestrictionType>none</RestrictionType>
        <InvoiceNumber>${poNumber}</InvoiceNumber>
        <NonDeliveryOption>Return</NonDeliveryOption>
        <CustomsItems>
            ${itemsxml}
        </CustomsItems>
        </CustomsInfo>`: ""}
        </LabelRequest>
        </GetPostageLabel>
        </soap:Body>
    </soap:Envelope>`
    const headers = {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": xml.length,
            "SaopAction": "www.envmgr.com/LabelService/GetPostageLabel"
        }
    }
    let res = await axios.post(`https://labelserver.endicia.com/LabelService/EwsLabelService.asmx?wsdl`, xml, headers)
    var parser = new xml2js.Parser(options);
    //console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    console.log(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0])
    console.log(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Label)
    if(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse.ErrorMessage){
        return {error: true, msg: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].ErrorMessage[0]}
    }else if(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Base64LabelImage){
        return {error: false, label: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Base64LabelImage[0], trackingNumber: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].TrackingNumber[0], cost: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].FinalPostage[0] }
    }else if(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Image?.length){
        return {error: false, label: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Image[0]._t[0] + "=", trackingNumber: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].TrackingNumber[0], cost: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].FinalPostage[0] }
    }else if(data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Image){
        return {error: false, label: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].Image._t[0] + "=", trackingNumber: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].TrackingNumber[0], cost: data['soap:Envelope']['soap:Body'][0].GetPostageLabelResponse[0].LabelRequestResponse[0].FinalPostage[0] }
    }
}

export async function requestRefund({PIC, enSettings}){
    let xml = `
        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <GetRefund xmlns="www.envmgr.com/LabelService">
                    <RefundRequest>
                        <RequesterID>${enSettings.requesterID}</RequesterID>
                        <RequestID>19hurt</RequestID>
                        <CertifiedIntermediary>
                            <AccountID>${enSettings.accountNumber}</AccountID>
                            <PassPhrase>${enSettings.passPhrase}</PassPhrase>p>
                        </CertifiedIntermediary>
                        <PicNumbers>
                            <PicNumber>${PIC}</PicNumber>
                        </PicNumbers>
                    </RefundRequest>
                </GetRefund>
            </soap:Body>
        </soap:Envelope>
    `
    const headers = {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": xml.length,
            "SaopAction": "www.envmgr.com/LabelService/GetRefund"
        }
    }
    let res = await axios.post(`https://labelserver.endicia.com/LabelService/EwsLabelService.asmx?wsdl`, xml, headers)
    var parser = new xml2js.Parser(options);
    //console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    console.log(data['soap:Envelope']['soap:Body'][0].GetRefundResponse[0].RefundResponse[0])
    console.log(data['soap:Envelope']['soap:Body'][0].GetRefundResponse[0].RefundResponse[0].Refund[0])
    if(data['soap:Envelope']['soap:Body'][0].GetRefundResponse[0].RefundResponse[0].Refund[0].RefundStatus[0] == "DeniedInvalid"){
        return {error: true, msg: data['soap:Envelope']['soap:Body'][0].GetRefundResponse[0].RefundResponse[0].Refund[0].RefundStatusMessage[0]}
    }else{
        return {error: false, msg: data['soap:Envelope']['soap:Body'][0].GetRefundResponse[0].RefundResponse[0].Refund[0].RefundStatus[0]}
    }
}