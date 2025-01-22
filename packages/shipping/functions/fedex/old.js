

export async function getRatesFeOld({credentials, weight, packaging, serviceType, businessAddress, address,}){
    let xml = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAPENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://fedex.com/ws/rate/v28">
        <SOAP-ENV:Body>
            <RateRequest>
                <WebAuthenticationDetail>
                    <UserCredential>
                        <Key>${process.env.tpalfedexkey}</Key>
                        <Password>${process.env.tpalfedexpassword}</Password>
                    </UserCredential>
                </WebAuthenticationDetail>
                <ClientDetail>
                    <AccountNumber>${process.env.tpalfedexaccountnumber}</AccountNumber>
                    <MeterNumber>${process.env.tpalfedexmeternumber}</MeterNumber>
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
                    <PackagingType>${packaging != undefined? packaging: "YOUR_PACKAGING"}</PackagingType>
                    <TotalWeight>
                        <Units>LB</Units>
                        <Value>${(weight /16).toFixed(2)}</Value>
                    </TotalWeight>
                    <Shipper>
                        <AccountNumber>${process.env.tpalfedexaccountnumber}</AccountNumber>
                        <Contact>
                            <CompanyName>TeeShirtPalace</CompanyName>
                            <PhoneNumber>248-549-7922</PhoneNumber>
                        </Contact>
                        <Address>
                            <StreetLines>21440 Melrose Ave</StreetLines>
                            <StreetLines></StreetLines>
                            <City>Southfield</City>
                            <StateOrProvinceCode>MI</StateOrProvinceCode>
                            <PostalCode>48075</PostalCode>
                            <CountryCode>US</CountryCode>
                        </Address>
                    </Shipper>
                    <Recipient>
                        <AccountNumber>${process.env.tpalfedexaccountnumber}</AccountNumber>
                        <Contact>
                            <PersonName>${order.shippingAddress.name.replace(/&/g, "and").replace(/[^0-9a-z]/gi, '')}</PersonName>
                            <PhoneNumber>${order.shippingAddress.phone}</PhoneNumber>
                        </Contact>
                        <Address>
                            <StreetLines>${order.shippingAddress.address1.replace(/[^0-9a-z]/gi, '')}</StreetLines>
                            <StreetLines>${order.shippingAddress.address2}</StreetLines>
                            <City>${order.shippingAddress.city.replace(/[^0-9a-z]/gi, '')}</City>
                            <StateOrProvinceCode>${order.shippingAddress.state.replace(/[^0-9a-z]/gi, '')}</StateOrProvinceCode>
                            <PostalCode>${order.shippingAddress.zip.toUpperCase()}</PostalCode>
                            <CountryCode>${order.shippingAddress.country}</CountryCode>
                            ${serviceType == "GROUND_HOME_DELIVERY" ? "<Residential>1</Residential>": ""}
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
                    ${serviceType == "SMART_POST"?`<SmartPostDetail><Indicia>${service}</Indicia><AncillaryEndorsement>CARRIER_LEAVE_IF_NO_RESPONSE</AncillaryEndorsement><HubId>5436</HubId><CustomerManifestId>MANIFSETID</CustomerManifestId></SmartPostDetail>`:""}
                    <RateRequestTypes>LIST</RateRequestTypes>
                    <PackageCount>1</PackageCount>
                    <RequestedPackageLineItems>
                        <SequenceNumber>1</SequenceNumber>
                        <GroupNumber>1</GroupNumber>
                        <GroupPackageCount>1</GroupPackageCount>
                        <Weight>
                            <Units>LB</Units>
                            <Value>${(weight /16).toFixed(2)}</Value>
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
    </SOAP-ENV:Envelope>`
}