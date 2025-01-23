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
export async function getRatesFeOld({credentials, weight, packaging, serviceType, service, businessAddress, address,}){
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
                            <Length>${10}</Length>
                            <Width>${10}</Width>
                            <Height>${1}</Height>
                            <Units>IN</Units>
                        </Dimensions>
                    </RequestedPackageLineItems>
                </RequestedShipment>
            </RateRequest>
        </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>`;
    
    let res = await axios.post(`https://ws.fedex.com:443/web-services `, xml).catch(e=>{console.log(e.response.data)});
    var parser = new xml2js.Parser(options);
    //console.log(res.data)
    let data = await parser.parseStringPromise(res.data);
    // console.log(
    //   data["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0].RateReply[0]
    //     .RateReplyDetails[0].RatedShipmentDetails[0].ShipmentRateDetail[0]
    //     .TotalNetFedExCharge[0].Amount
    // );
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