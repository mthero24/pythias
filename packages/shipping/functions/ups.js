import fetch from 'node-fetch';
let access_token
let expires_in
let getNew = new Date(Date.now())
const csv = require("csvtojson");
let zones = {}
let rates = {}
import jsPDF from 'jspdf';
import sharp from "sharp"

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
      //if(data.response) console.log(data.response, "auth");
      getNew = new Date(Date.now() + (parseInt(data.expires_in) * 1000))
      access_token = data.access_token
      return access_token
    }else{
      return access_token
    }
}
export async function ship({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials, thirdParty, imageFormat}) {
    console.log(thirdParty, "+++++++++++++++++++++ third party")
    let bill 
    if(!thirdParty){
      bill =  {"BillShipper":{
        "AccountNumber": credentials.upsAccountNumber}}
    }
    else bill = {BillThirdParty:{
      "AccountNumber": thirdParty,
      Address: {
        PostalCode: "83401",
        CountryCode: "US"
      }}
    }
    console.log(bill)
    let body = {
        "ShipmentRequest": {
          "Request": {
            "RequestOption": "validate'",
            "TransactionReference": {
              "CustomerContext": poNumber
            }
          },
          "Shipment": {
            "Description": "D2R shipments",
            ShipmentRatingOptions: {
              NegotiatedRatesIndicator: "Y"
            },
            "Shipper": {
              Name: businessAddress.name,
              "ShipperNumber": credentials.accountNumber,
              "EMailAddress": "michaelthero@teeshirtpalace.com",
              Address: {
                AddressLine: [
                  businessAddress.addressLine1,
                  businessAddress.addressLine2
                ],
                City: businessAddress.city,
                StateProvinceCode: businessAddress.state,
                PostalCode: businessAddress.postalCode,
                CountryCode: businessAddress.country
              }
            },
            "ShipTo": {
              "Name": address.name,
              "Phone": {
                "Number": address.phoneNumber? address.phoneNumber: "0000000000"
              },
              "EMailAddress": " ",
              "Address": {
                "AddressLine": [
                  address.address1,
                  address.address2
                ],
                "City": address.city,
                "StateProvinceCode": address.state,
                "PostalCode": address.zip,
                "CountryCode": address.country
              }
            },
            "AlternateDeliveryAddress": {
              "Name": businessAddress.name,
              "Phone": {
                "Number": businessAddress.phoneNumber
              },
              "EMailAddress": businessAddress.emailAddress,
              "Address": {
                "AddressLine": [
                  businessAddress.addressLine1,
                  businessAddress.addressLine2
                ],
                "City": businessAddress.city,
                "StateProvinceCode": businessAddress.state,
                "PostalCode": businessAddress.postalCode,
                "CountryCode": businessAddress.country
              }
            },
            ShipFrom: {
              Name: businessAddress.name,
              Address: {
                AddressLine: [
                  businessAddress.addressLine1,
                  businessAddress.addressLine2
                ],
                City: businessAddress.city,
                StateProvinceCode: businessAddress.state,
                PostalCode: businessAddress.postalCode,
                CountryCode: businessAddress.country
              }
            },
            "PaymentInformation": {
              "ShipmentCharge": {
                "Type": "01",
                ...bill
              }
            },
            "Service": {
              "Code": selectedShipping.service,
              "Description": selectedShipping.description
            },
            USPSEndorsement: "1",
            PackageID: poNumber,
            "ShipmentServiceOptions": {
              "Notification": {
                "NotificationCode": "8",
                "EMail": {
                  "EMailAddress": businessAddress.emailAddress
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
                "Code": selectedShipping.packageType,
                "Description": selectedShipping.packageDescription
              },
             
              "PackageWeight": {
                "UnitOfMeasurement": {
                  "Code": "LBS",
                  "Description": "Pounds"
                },
                "Weight": (weight / 16).toString()
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
              "Code": imageFormat? imageFormat == "PDF"? "GIF": imageFormat: "ZPL"
            },
            "LabelStockSize": {
              "Height": "6",
              "Width": "4"
            }
          }
        }
      }
  console.log(body.ShipmentRequest.Shipment.PaymentInformation)
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
      return {error: 101, msg: JSON.stringify(data.response.errors)}
    }else{
      console.log(data.ShipmentResponse.ShipmentResults, "results",)
      console.log(data.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.ImageFormat, "results",)
      //console.log(data.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage)
      let pdf = new jsPDF('l', 'in', [4, 6]);
      let buf = Buffer.from(data.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage, "base64")
      console.log(buf, "buff")
      let image = sharp(buf)
      image = await image.png({ quality: 100 }).toBuffer();
      let trimmedBase64 = `data:image/png;base64,${image.toString("base64")}`;
      pdf.addImage(trimmedBase64, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      let final = Buffer.from(pdf.output('arraybuffer'))
      final = final.toString("base64")
      console.log(final + "==")
      let result = {trackingNumber: data.ShipmentResponse.ShipmentResults.PackageResults.TrackingNumber, label: final, cost:  selectedShipping.service == "M4"?data.ShipmentResponse.ShipmentResults.ShipmentCharges.TotalCharges.MonetaryValue: data.ShipmentResponse.ShipmentResults.NegotiatedRateCharges? data.ShipmentResponse.ShipmentResults.NegotiatedRateCharges.TotalCharge.MonetaryValue : data.ShipmentResponse.ShipmentResults.ShipmentCharges.TotalCharges.MonetaryValue}
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
            Name: businessAddress.name,
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
              PostalCode: businessAddress.postalCode,
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


 
