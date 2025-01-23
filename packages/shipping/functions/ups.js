import fetch from 'node-fetch';
let access_token
let expires_in
let getNew = new Date(Date.now())
const csv = require("csvtojson");
let zones = {}
let rates = {}

let getZones = async ()=>{
  let zo = await csv().fromFile('./functions/zone.csv')
  //console.log(zo)
  for(let z of zo){
    if(z.field2 != '' && z.field2 != 'Zone'){
      if(!zones[z.field2]) zones[z.field2] = [z.field1]
      else zones[z.field2].push(z.field1)
    }
  }
  //console.log(zones)
}
//getZones()

let getRates = async ()=>{
  let rate = await csv().fromFile('./functions/UPSRates.csv')
  for(let r of rate){
    if(!rates[r.weight]) rates[r.Weight] = {
      zone1: r["Zone 1"],
      zone2: r["Zone 2"],
      zone3: r["Zone 3"],
      zone4: r["Zone 4"],
      zone5: r["Zone 5"],
      zone6: r["Zone 6"],
      zone7: r["Zone 7"],
      zone8: r["Zone 8"],
      zone9: r["Zone 9"],
    }
  }
  //console.log(rates)
}
//getRates()
async function auth(credentials) {
    console.log(credentials)
    if(new Date(Date.now()) > new Date(getNew)){
      const formData = {
          grant_type: 'client_credentials'
      };

      const resp = await fetch(
      `https://onlinetools.ups.com/security/v1/oauth/token`,
      {
          method: 'POST',
          headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-merchant-id': 'H5500V',
          Authorization: 'Basic ' + Buffer.from(`${credentials.clientID}:${credentials.clientSecret}`).toString('base64')
          },
          body: new URLSearchParams(formData).toString()
      }
      );

      const data = await resp.json();
      if(data.response) console.log(data.response, "auth");
      getNew = new Date(Date.now() + (parseInt(data.expires_in) * 1000))
      access_token = data.access_token
      return access_token
    }else{
      return access_token
    }
}
export async function ship({order, service, description, packageType, packageDescription, weight, credentials}) {
    let body = {
        "ShipmentRequest": {
          "Request": {
            "RequestOption": "validate'",
            "TransactionReference": {
              "CustomerContext": order.poNumber
            }
          },
          "Shipment": {
            "Description": "D2R shipments",
            ShipmentRatingOptions: {
              NegotiatedRatesIndicator: "Y"
            },
            "Shipper": {
              Name: order.user.addresses[0].name,
              "ShipperNumber": process.env.UPSAccountNumber,
              "EMailAddress": "michaelthero@teeshirtpalace.com",
              Address: {
                AddressLine: [
                  order.user.addresses[0].address1,
                  order.user.addresses[0].address2
                ],
                City: order.user.addresses[0].city,
                StateProvinceCode: order.user.addresses[0].state,
                PostalCode: order.user.addresses[0].zip,
                CountryCode: order.user.addresses[0].country
              }
            },
            "ShipTo": {
              "Name": order.shippingAddress.name,
              "Phone": {
                "Number": order.shippingAddress.phoneNumber? order.shippingAddress.phoneNumber: "0000000000"
              },
              "EMailAddress": " ",
              "Address": {
                "AddressLine": [
                  order.shippingAddress.address1,
                  order.shippingAddress.address2
                ],
                "City": order.shippingAddress.city,
                "StateProvinceCode": order.shippingAddress.state,
                "PostalCode": order.shippingAddress.zip,
                "CountryCode": order.shippingAddress.country
              }
            },
            "AlternateDeliveryAddress": {
              "Name": order.user.addresses[0].name,
              "Phone": {
                "Number": order.user.addresses[0].phoneNumber
              },
              "EMailAddress": order.emailAddress,
              "Address": {
                "AddressLine": [
                  order.user.addresses[0].address1,
                  order.user.addresses[0].address2
                ],
                "City": order.user.addresses[0].city,
                "StateProvinceCode": order.user.addresses[0].state,
                "PostalCode": order.user.addresses[0].zip,
                "CountryCode": order.user.addresses[0].country
              }
            },
            ShipFrom: {
              Name: order.user.addresses[0].name,
              Address: {
                AddressLine: [
                  order.user.addresses[0].address1,
                  order.user.addresses[0].address2
                ],
                City: order.user.addresses[0].city,
                StateProvinceCode: order.user.addresses[0].state,
                PostalCode: order.user.addresses[0].zip,
                CountryCode: order.user.addresses[0].country
              }
            },
            "PaymentInformation": {
              "ShipmentCharge": {
                "Type": "01",
                "BillShipper": {
                  "AccountNumber": process.env.UPSAccountNumber
                }
              }
            },
            "Service": {
              "Code": service,
              "Description": description
            },
            USPSEndorsement: "1",
            PackageID: order.poNumber,
            "ShipmentServiceOptions": {
              "Notification": {
                "NotificationCode": "8",
                "EMail": {
                  "EMailAddress": order.user.email
                },
                "Locale": {
                  "Language": "ENG",
                  "Dialect": "US"
                }
              },
              LabelLinksIndicator: true
            },
            "Package": {
              "Description": "D2R shipment",
              "Packaging": {
                "Code": packageType,
                "Description": packageDescription
              },
             
              "PackageWeight": {
                "UnitOfMeasurement": {
                  "Code": "LBS",
                  "Description": "Pounds"
                },
                "Weight": weight.toString()
              },
              
            }
          },
          "PackageServiceOptions": {
            "DeclaredValue": {
              "Type": {
                "Code": "01",
                "Description": "Declared value"
              },
              "CurrencyCode": "EUR",
              "MonetaryValue": "10.30"
            }
          },
          "LabelSpecification": {
            "LabelImageFormat": {
              "Code": "ZPL"
            },
            "LabelStockSize": {
              "Height": "6",
              "Width": "4"
            }
          }
        }
      }

  const version = 'v1';
  let authorizeToken = await auth(credentials);
  console.log(authorizeToken, "token")
  const resp = await fetch(
    `https://onlinetools.ups.com/api/shipments/${version}/ship`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        transId: 'string',
        transactionSrc: 'testing',
        Authorization: `Bearer ${authorizeToken}`
      },
      body: JSON.stringify(body)
    });
    //console.log(resp)
    const data = await resp.json();
    if(data.response){
      console.log(data.response.errors, "errors");
      return {error: 101}
    }else{
      console.log(data.ShipmentResponse.ShipmentResults, "results",  packageType , packageType == "M4");
     // console.log(data.ShipmentResponse.ShipmentResults.PackageResults, "results");
      let result = {trackingNumber: data.ShipmentResponse.ShipmentResults.PackageResults.TrackingNumber, label: new Buffer.from(data.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage, "base64").toString('ascii'), cost:  service == "M4"?data.ShipmentResponse.ShipmentResults.ShipmentCharges.TotalCharges.MonetaryValue: data.ShipmentResponse.ShipmentResults.NegotiatedRateCharges.TotalCharge.MonetaryValue}
      return result
    }
}

export async function getRatesUPS({address, businessAddress, service, description, packageType, packageDescription, weight, credentials}) {
    const query = new URLSearchParams({
      additionalinfo: 'string'
    }).toString();
    let body = {
      RateRequest: {
        Request: {
          RequestOption: "Rate",
          SubVersion: 2205,
          TransactionReference: {
            CustomerContext: address.name
          }
        },
        PickupType:{
          Code: "01",
          Description: "Daily Pickup"
        },
        CustomerClassification: {
          Code: "00",
          Description: "Rates Associated with Shipper Number"
        },
        Shipment: {
          Shipper: {
            Name: "Print Oracle",
            ShipperNumber: credentials.accountNumber,
            Address: {
              AddressLine: [
                businessAddress.addressLine1,
                businessAddress.addressLin2
              ],
              City: businessAddress.city,
              StateProvinceCode: businessAddress.state,
              PostalCode: businessAddress.postalCode,
              CountryCode: businessAddress.country
            }
          },
          ShipTo: {
            Name: address.name,
            Address: {
              AddressLine: [
                address.address1,
                address.address2
              ],
              City: address.city,
              StateProvinceCode: address.state,
              PostalCode: address.zip,
              CountryCode: address.country
            }
          },
          ShipFrom: {
            Name: businessAddress.companyName,
            Address: {
              AddressLine: [
                businessAddress.addressLine1,
                businessAddress.addressLine2
              ],
              City: businessAddress.city,
              StateProvinceCode: businessAddress.state,
              PostalCode: businessAddress.zip,
              CountryCode: businessAddress.country
            }
          },
          PaymentDetails: {
            ShipmentCharge: {
              Type: '01',
              BillShipper: {
                AccountNumber: credentials.accountNumber
              }
            }
          },
          Service: {
            Code: service,
            Description: description
          },
          NumOfPieces: '1',
          Package: {
            PackagingType: {
              Code: packageType,
              Description: packageDescription
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'LBS',
                Description: 'Pounds'
              },
              Weight: (weight).toString()
            }
          }
        }
      }
    }
    const version = 'v2205';
    const requestoption = 'Rate';
    let authorizeToken = await auth(credentials);
    console.log(authorizeToken)
    const resp = await fetch(
      `https://onlinetools.ups.com/api/rating/${version}/Rate?`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          transId: 'string',
          transactionSrc: 'testing',
          Authorization: `Bearer ${authorizeToken}`
        },
        body: JSON.stringify(body)
      }
    );
  
    const data = await resp.json();
    if(data.response){
      console.log(data.response);
      return 5000
    }else{
      console.log(data.RateResponse.RatedShipment.TotalCharges.MonetaryValue);
      return data.RateResponse.RatedShipment.TotalCharges.MonetaryValue
    }
  }


 