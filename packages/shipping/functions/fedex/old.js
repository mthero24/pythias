import axios from "axios";
var xml2js = require("xml2js");
let options = {
  object: true,
  reversible: false,
  coerce: false,
  sanitize: true,
  trim: true,
  arrayNotation: false,
  alternateTextNode: true,
};
export async function getRatesFeOld({credentials, weight, packaging, dimensions, serviceType, service, businessAddress, address, saturdayDelivery}){
    console.log(dimensions, "dimensions")
    let xml = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAPENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://fedex.com/ws/rate/v28">
        <SOAP-ENV:Body>
            <RateRequest>
                <WebAuthenticationDetail>
                    <UserCredential>
                        <Key>${credentials.key}</Key>
                        <Password>${credentials.password}</Password>
                    </UserCredential>
                </WebAuthenticationDetail>
                <ClientDetail>
                    <AccountNumber>${credentials.accountNumber}</AccountNumber>
                    <MeterNumber>${credentials.meterNumber}</MeterNumber>
                </ClientDetail>
                <TransactionDetail>
                    <CustomerTransactionId>RateRequest_v28</CustomerTransactionId>
                </TransactionDetail>
                <Version>
                    <ServiceId>crs</ServiceId>
                    <Major>28</Major>
                    <Intermediate>0</Intermediate>
                    <Minor>0</Minor>
                </Version>
                <RequestedShipment>
                    <DropoffType>REGULAR_PICKUP</DropoffType>
                    <ServiceType>${serviceType}</ServiceType>
                    <PackagingType>${packaging != undefined ? packaging : "YOUR_PACKAGING"}</PackagingType>
                    <TotalWeight>
                        <Units>LB</Units>
                        <Value>${(weight / 16).toFixed(2)}</Value>
                    </TotalWeight>
                    <Shipper>
                        <AccountNumber>${process.env.tpalfedexaccountnumber}</AccountNumber>
                        <Contact>
                            <CompanyName>${businessAddress.companyName}</CompanyName>
                            <PhoneNumber>${businessAddress.phoneNumber}</PhoneNumber>
                        </Contact>
                        <Address>
                            <StreetLines>${businessAddress.addressLine1}</StreetLines>
                            <StreetLines>${businessAddress.addressLine2}</StreetLines>
                            <City>${businessAddress.city}</City>
                            <StateOrProvinceCode>${businessAddress.state}</StateOrProvinceCode>
                            <PostalCode>${businessAddress.postalCode}</PostalCode>
                            <CountryCode>${businessAddress.country}</CountryCode>
                        </Address>
                    </Shipper>
                    <Recipient>
                        <AccountNumber>${credentials.accountNumber}</AccountNumber>
                        <Contact>
                            <PersonName>${address.name.replace(/&/g, "and").replace(/[^0-9a-z]/gi, "")}</PersonName>
                            <PhoneNumber>${address.phone}</PhoneNumber>
                        </Contact>
                        <Address>
                            <StreetLines>${address.address1.replace(/[^0-9a-z]/gi, "")}</StreetLines>
                            <StreetLines>${address.address2}</StreetLines>
                            <City>${address.city.replace(/[^0-9a-z]/gi, "")}</City>
                            <StateOrProvinceCode>${address.state.replace(/[^0-9a-z]/gi, "")}</StateOrProvinceCode>
                            <PostalCode>${address.zip.toUpperCase()}</PostalCode>
                            <CountryCode>${address.country}</CountryCode>
                            ${serviceType == "GROUND_HOME_DELIVERY" ? "<Residential>1</Residential>" : ""}
                        </Address>
                    </Recipient>
                    <ShippingChargesPayment>
                        <PaymentType>SENDER</PaymentType>
                        <Payor>
                            <ResponsibleParty>
                                <AccountNumber>${process.env.tpalfedexaccountnumber}</AccountNumber>
                                <Tins>
                                    <TinType>BUSINESS_STATE</TinType>
                                    <Number>MI</Number>
                                </Tins>
                            </ResponsibleParty>
                        </Payor>
                    </ShippingChargesPayment>
                    ${serviceType == "SMART_POST" ? `<SmartPostDetail><Indicia>${service}</Indicia><AncillaryEndorsement>CARRIER_LEAVE_IF_NO_RESPONSE</AncillaryEndorsement><HubId>5436</HubId><CustomerManifestId>MANIFSETID</CustomerManifestId></SmartPostDetail>` : ""}
                    <RateRequestTypes>LIST</RateRequestTypes>
                    <PackageCount>1</PackageCount>
                    <RequestedPackageLineItems>
                        <SequenceNumber>1</SequenceNumber>
                        <GroupNumber>1</GroupNumber>
                        <GroupPackageCount>1</GroupPackageCount>
                        <Weight>
                            <Units>LB</Units>
                            <Value>${(weight / 16).toFixed(2)}</Value>
                        </Weight>
                        <Dimensions>
                            <Length>${dimensions.length}</Length>
                            <Width>${dimensions.width}</Width>
                            <Height>${dimensions.height}</Height>
                            <Units>IN</Units>
                        </Dimensions>
                    </RequestedPackageLineItems>
                </RequestedShipment>
            </RateRequest>
        </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>`;
    
    let res = await axios.post(`https://ws.fedex.com:443/web-services `, xml).catch(e=>{console.log(e.response.data)});
    var parser = new xml2js.Parser(options);
    let data = await parser.parseStringPromise(res.data);
    if (data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].RateReply[0].Notifications[0].Severity[0] == "ERROR"){
        return {error: true, msg:data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].RateReply[0].Notifications[0].Message[0]}
    }else return {
      error: false,
      rate: parseFloat(
        data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].RateReply[0]
          .RateReplyDetails[0].RatedShipmentDetails[0].ShipmentRateDetail[0]
          .TotalNetFedExCharge[0].Amount
      )
    };
}

export async function purchaseLabel({credentials, weight, poNumber, selectedShipping, dimensions, businessAddress, address, saturdayDelivery}){
    let service = weight < 16 ? "PRESORTED_STANDARD" : "PARCEL_SELECT"
    let xml =`
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v22="http://fedex.com/ws/ship/v22">
            <soapenv:Header/>
            <soapenv:Body>
                <v22:ProcessShipmentRequest>
                    <v22:WebAuthenticationDetail>
                        <v22:UserCredential>
                            <v22:Key>${credentials.key}</v22:Key>
                            <v22:Password>${credentials.password}</v22:Password>
                        </v22:UserCredential>
                    </v22:WebAuthenticationDetail>
                    <v22:ClientDetail>
                        <v22:AccountNumber>${credentials.accountNumber}</v22:AccountNumber>
                        <v22:MeterNumber>${credentials.meterNumber}</v22:MeterNumber>
                    </v22:ClientDetail>
                    <v22:TransactionDetail>
                        <v22:CustomerTransactionId>${poNumber}</v22:CustomerTransactionId>
                    </v22:TransactionDetail>
                    <v22:Version>
                        <v22:ServiceId>ship</v22:ServiceId>
                        <v22:Major>22</v22:Major>
                        <v22:Intermediate>0</v22:Intermediate>
                        <v22:Minor>0</v22:Minor>
                    </v22:Version>
                    <v22:RequestedShipment>
                    <v22:ShipTimestamp>${new Date(Date.now()).toISOString()}</v22:ShipTimestamp>
                    <v22:DropoffType>REGULAR_PICKUP</v22:DropoffType>
                    <v22:ServiceType>${selectedShipping.name}</v22:ServiceType>
                    <v22:PackagingType>${selectedShipping.packaging}</v22:PackagingType>
                    <v22:TotalWeight>
                        <v22:Units>LB</v22:Units>
                        <v22:Value>${(weight / 16).toFixed(2)}</v22:Value>
                    </v22:TotalWeight>
                    <v22:Shipper>
                        <v22:AccountNumber>${credentials.accountNumber}</v22:AccountNumber>
                        <v22:Contact>
                            <v22:CompanyName>${businessAddress.name}</v22:CompanyName>
                            <v22:PhoneNumber>${businessAddress.phone? businessAddress.phone: "248-549-7922"}</v22:PhoneNumber>
                        </v22:Contact>
                        <v22:Address>
                            <v22:StreetLines>${businessAddress.address1? businessAddress.address1: businessAddress.addressLine1}</v22:StreetLines>
                            <v22:StreetLines>${businessAddress.address2 || businessAddress.addressLine2? businessAddress.address2? businessAddress.address2: businessAddress.addressLine2: ""}</v22:StreetLines>
                            <v22:City>${businessAddress.city}</v22:City>
                            <v22:StateOrProvinceCode>${businessAddress.state}</v22:StateOrProvinceCode>
                            <v22:PostalCode>${businessAddress.zip? businessAddress.zip: businessAddress.postalCode}</v22:PostalCode>
                            <v22:CountryCode>${businessAddress.country? businessAddress.country: "US"}</v22:CountryCode>
                        </v22:Address>
                    </v22:Shipper>
                    <v22:Recipient>
                        <v22:AccountNumber>${credentials.accountNumber}</v22:AccountNumber>
                        <v22:Contact>
                            <v22:PersonName>${address.name.replace(/&/g, "and").replace(/[^\w\s]/gi, '')}</v22:PersonName>
                            <v22:CompanyName></v22:CompanyName>
                            <v22:PhoneNumber>${address.phone? address.phone: "0000000000"}</v22:PhoneNumber>
                        </v22:Contact>
                        <v22:Address>
                            <v22:StreetLines>${address.address1.replace(/[^\w\s]/gi, '')}</v22:StreetLines>
                            ${address.address2 != undefined  &&  address.address2 != ""? `<v22:StreetLines>${address.address2.replace(/[^\w\s]/gi, '')}</v22:StreetLines>`: ""}
                            <v22:City>${address.city.replace(/[^\w\s]/gi, '')}</v22:City>
                            <v22:StateOrProvinceCode>${address.state}</v22:StateOrProvinceCode>
                            <v22:PostalCode>${address.zip.replace(" ", "").toUpperCase().split("-")[0]}</v22:PostalCode>
                            <v22:CountryCode>${address.country}</v22:CountryCode>
                            ${selectedShipping.name == "GROUND_HOME_DELIVERY" ? "<v22:Residential>1</v22:Residential>": ""}
                        </v22:Address>
                    </v22:Recipient>
                    <v22:ShippingChargesPayment>
                        <v22:PaymentType>SENDER</v22:PaymentType>
                        <v22:Payor>
                            <v22:ResponsibleParty>
                                <v22:AccountNumber>${credentials.accountNumber}</v22:AccountNumber>
                                <v22:Contact>
                                    <v22:CompanyName>${businessAddress.companyName}</v22:CompanyName>
                                    <v22:PhoneNumber>248-549-7922</v22:PhoneNumber>
                                </v22:Contact>
                                <v22:Address>
                                    <v22:StreetLines>${businessAddress.address1? businessAddress.address1: businessAddress.addressLine1}</v22:StreetLines>
                                    <v22:StreetLines>${businessAddress.address2 || businessAddress.addressLine2? businessAddress.address2? businessAddress.address2: businessAddress.addressLine2: ""}</v22:StreetLines>
                                    <v22:City>${businessAddress.city}</v22:City>
                                    <v22:StateOrProvinceCode>${businessAddress.state}</v22:StateOrProvinceCode>
                                    <v22:PostalCode>${businessAddress.zip? businessAddress.zip: businessAddress.postalCode}</v22:PostalCode>
                                    <v22:CountryCode>${businessAddress.country? businessAddress.country: "US"}</v22:CountryCode>
                                </v22:Address>
                            </v22:ResponsibleParty>
                        </v22:Payor>
                    </v22:ShippingChargesPayment>
                    ${(((selectedShipping.name == "FEDEX_2_DAY" && new Date(Date.now()).toString().split(" ")[0] == "Thu") && (!selectedShipping.packaging == "FEDEX_ENVELOPE") && (!selectedShipping.packaging == "FEDEX_PAK")) || ((selectedShipping.name == "STANDARD_OVERNIGHT" || selectedShipping.name == "PRIORITY_OVERNIGHT") && saturdayDelivery))? `<v22:SpecialServicesRequested>
                                <v22:SpecialServiceTypes>SATURDAY_DELIVERY</v22:SpecialServiceTypes>
                            </v22:SpecialServicesRequested>`: ""}
                            ${((selectedShipping.packaging == "FEDEX_ENVELOPE" || selectedShipping.packaging == "FEDEX_PAK") && selectedShipping.name == "FEDEX_2_DAY") && !(selectedShipping.service == "FEDEX_2_DAY" && new Date(Date.now()).toString().split(" ")[0] == "Thu") && !saturdayDelivery ? `<v22:SpecialServicesRequested>
                            <v22:SpecialServiceTypes>FEDEX_ONE_RATE</v22:SpecialServiceTypes>
                        </v22:SpecialServicesRequested>`: ""}
                        ${(((selectedShipping.packaging == "FEDEX_ENVELOPE" || selectedShipping.packaging == "FEDEX_PAK") && selectedShipping.name == "FEDEX_2_DAY") && (((selectedShipping.name == "FEDEX_2_DAY" && new Date(Date.now()).toString().split(" ")[0] == "Thu") && saturdayDelivery != false) || saturdayDelivery)) ? `<v22:SpecialServicesRequested>
                        <v22:SpecialServiceTypes>FEDEX_ONE_RATE</v22:SpecialServiceTypes>
                        <v22:SpecialServiceTypes>SATURDAY_DELIVERY</v22:SpecialServiceTypes>
                    </v22:SpecialServicesRequested>`: ''}
                    ${selectedShipping.name == "SMART_POST"?`<v22:SmartPostDetail><v22:Indicia>${service}</v22:Indicia><v22:AncillaryEndorsement>RETURN_SERVICE</v22:AncillaryEndorsement><v22:HubId>5436</v22:HubId></v22:SmartPostDetail>`:""}
                    ${address.country != "US"? `<v22:BlockInsightVisibility>true</v22:BlockInsightVisibility>` : ""}
                    <v22:LabelSpecification>
                        <v22:LabelFormatType>COMMON2D</v22:LabelFormatType>
                        <v22:ImageType>ZPLII</v22:ImageType>
                        <v22:LabelStockType>STOCK_4X6</v22:LabelStockType>
                    </v22:LabelSpecification>
                    ${address.country != "US"? `<v22:ShippingDocumentSpecification>
                    <v22:ShippingDocumentTypes>COMMERCIAL_INVOICE</v22:ShippingDocumentTypes>
                    <v22:CommercialInvoiceDetail>
                        <v22:Format>
                            <v22:ImageType>PDF</v22:ImageType>
                            <v22:StockType>PAPER_LETTER</v22:StockType>
                            <v22:ProvideInstructions>1</v22:ProvideInstructions>
                        </v22:Format>
                        <v22:CustomerImageUsages><v22:Type>LETTER_HEAD</v22:Type><v22:Id>IMAGE_1</v22:Id></v22:CustomerImageUsages>
                    </v22:CommercialInvoiceDetail>
                </v22:ShippingDocumentSpecification>`: ""}
                    <v22:RateRequestTypes>LIST</v22:RateRequestTypes>
                    <v22:PackageCount>1</v22:PackageCount>
                    <v22:RequestedPackageLineItems>
                        <v22:SequenceNumber>1</v22:SequenceNumber>
                        <v22:InsuredValue>
                            <v22:Currency>USD</v22:Currency>
                            <v22:Amount>0.00</v22:Amount>
                        </v22:InsuredValue>
                        <v22:Weight>
                            <v22:Units>LB</v22:Units>
                            <v22:Value>${(weight / 16).toFixed(2)}</v22:Value>
                        </v22:Weight>
                        </v22:RequestedPackageLineItems>
                    </v22:RequestedShipment>
                </v22:ProcessShipmentRequest>
            </soapenv:Body>
        </soapenv:Envelope>
    `
    const headers = {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": xml.length,
        }
    }
    let res = await axios.post(`https://ws.fedex.com:443/web-services `, xml, headers).catch(e=>{console.log(e.response, "response")});
    //console.log(res?.data)
    var parser = new xml2js.Parser(options);
    let data = await parser.parseStringPromise(res?.data);
    console.log(data['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].ShipmentRating[0].ShipmentRateDetails[0].TotalNetChargeWithDutiesAndTaxes[0].Amount[0])
    //console.log(data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].MasterTrackingId[0].TrackingNumber[0])
    //console.log(data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].CompletedPackageDetails[0].Label[0].Parts[0].Image[0])
    if(data['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].ProcessShipmentReply[0].Notifications[0].Code[0] == "8241"){
        return {error: true, msg: data['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].ProcessShipmentReply[0].Notifications[0].Message[0] }
    }else{
        return {error: false, trackingNumber: data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].MasterTrackingId[0].TrackingNumber[0], label: data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].CompletedPackageDetails[0].Label[0].Parts[0].Image[0], cost: parseFloat(data['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].ProcessShipmentReply[0].CompletedShipmentDetail[0].ShipmentRating[0].ShipmentRateDetails[0].TotalNetChargeWithDutiesAndTaxes[0].Amount[0])}
    }
    
}