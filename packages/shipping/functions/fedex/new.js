import axios from "axios";
import dotenv from "dotenv";
import qs from "qs";

let carrierCodes = {
  FEDEX_GROUND: "FDXG",
  GROUND_HOME_DELIVERY: "FDXG",
  FEDEX_INTERNATIONAL_CONNECT_PLUS: "FDXG",
  FEDEX_2DAY: "FDXE",
  STANDARD_OVERNIGHT: "FDXE",
  PRIORITY_OVERNIGHT: "FDXE",
  SMART_POST: "FXSP",
};

let getAuth = async (credentials) => {
    console.log(credentials, "getauth")
  let body = {
    grant_type: "client_credentials",
    client_id: credentials.key,
    client_secret: credentials.secret,
  };
  body = qs.stringify(body);
  //console.log(body);
  let options = {
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
  };
  let send = await axios
    .post("https://apis-sandbox.fedex.com/oauth/token", body, options)
    .catch((e) => {
      console.log(e.response.data);
    });
  //console.log(send);
  return { token: send ? send.data.access_token : null };
};

export async function getRatesFeNew({address, businessAddress, weight, service, serviceType, packaging, overnight, saturdayDelivery=false, credentials}){
    console.log(credentials, "getrates")
    let token = await getAuth(credentials)
    token = token.token
    //console.log(token)
    let body = {
        "accountNumber": {
        "value": credentials.accountNumber
        },
        "rateRequestControlParameters": {
        "returnTransitTimes": true,
        "servicesNeededOnRateFailure": true,
        "rateSortOrder": "SERVICENAMETRADITIONAL"
        },
        "requestedShipment": {
            "shipper": {
                address: {
                    streetLines: [
                        businessAddress.addressLine1,
                        businessAddress.addressLine2
                    ],
                    city: businessAddress.city,
                    stateOrProvinceCode: businessAddress.state,
                    postalCode: businessAddress.postalCode,
                    countryCode: businessAddress.country,
                    residential: false
                }
            },
            "recipient": {
                address: {
                    streetLines: [
                        address.address1,
                        address.address2? address.address2: null
                    ],
                    city: address.city,
                    stateOrProvinceCode: address.state,
                    postalCode: address.zip,
                    countryCode: address.country,
                }
            },
            serviceType: serviceType,
            "preferredCurrency": "USD",
            "rateRequestType": [
                "ACCOUNT"
            ],
            "shipDateStamp": new Date().toISOString().split('T')[0],
            "pickupType": "USE_SCHEDULED_PICKUP",
            "requestedPackageLineItems": [{
                "subPackagingType": "BAG",
                "groupPackageCount": 1,
                
                "weight": {
                    "units": "LB",
                    "value": ((weight / 16) > 1? (weight / 16): 1).toFixed(1)
                },
                "dimensions": {
                    "length": 10,
                    "width": 8,
                    "height": 2,
                    "units": "IN"
                },
            }],
            "documentShipment": false,
            "variableHandlingChargeDetail": {"rateElementBasis": "NET_CHARGE"},
            "packagingType": packaging,
            "totalPackageCount": 1,
            "totalWeight": weight,
            "groupShipment": false,
        },
        "carrierCodes": [
            carrierCodes[serviceType]
        ]
    }
    if(serviceType == "GROUND_HOME_DELIVERY") body.requestedShipment.recipient.address.residential = true
    //console.log(body.requestedShipment.recipient.address)
    if(serviceType == "SMART_POST"){
        body.requestedShipment.smartPostInfoDetail = {
            "hubId": 5531,
            "indicia": "PARCEL_SELECT"
          }
    }
    //console.log(body.requestedShipment)
    if(!body.shipmentSpecialServices) body.shipmentSpecialServices = {}
    if((packaging == "FEDEX_PAK" || packaging == "FEDEX_ENVELOPE") && serviceType == "FEDEX_2DAY" && saturdayDelivery){
        body.shipmentSpecialServices.specialServiceTypes = ["FEDEX_ONE_RATE", "SATURDAY_DELIVERY"]
    }
    else if((packaging == "FEDEX_PAK" || packaging == "FEDEX_ENVELOPE") && serviceType == "FEDEX_2DAY" && !saturdayDelivery){
        body.shipmentSpecialServices.specialServiceTypes = ["FEDEX_ONE_RATE"]
    }else if(saturdayDelivery) body.shipmentSpecialServices.specialServiceTypes = ["SATURDAY_DELIVERY"]
     //console.log(body)
    let options = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    }
    let resData
    let send = await axios.post("https://apis-sandbox.fedex.com/rate/v1/rates/quotes", body, options).catch(e=>{console.log(e.response.data); resData = e.response.data;})
    //console.log(send? send.data.output.rateReplyDetails[0].ratedShipmentDetails[0] : resData)
    if(resData) return {error:true, msg: `${resData.errors[0].message} ${resData.errors[0].code}`}
    return {error: false, rate: send.data.output.rateReplyDetails[0].ratedShipmentDetails[0].totalNetFedExCharge}
    
}
export async function purchaseFedexNew ({address, businessAddress,weight, service, serviceType, packaging, overnight, saturdayDelivery=false, credentials}){
    let token = await getAuth(credentials)
    token = token.token
    console.log(token)
    let body = {
        "requestedShipment": {
          "shipDatestamp": new Date().toISOString().split('T')[0],
          "totalDeclaredValue": {
            "amount": 25,
            "currency": "USD"
          },
          "shipper": {
            address: {
                streetLines: [
                    businessAddress.addressLine1,
                    businessAddress.addressLine2
                ],
                city: businessAddress.city,
                stateOrProvinceCode: businessAddress.state,
                postalCode: businessAddress.postalCode,
                countryCode: businessAddress.country,
                residential: false
            },
            "contact": {
              "personName": businessAddress.name,
              "emailAddress": businessAddress.email,
              "phoneNumber": businessAddress.phoneNumber,
              "companyName": businessAddress.name,
            },
          },
          "recipients": [
            {
               address: {
                    streetLines: [
                        address.address1,
                        address.address2? address.address2: null
                    ],
                    city: address.city,
                    stateOrProvinceCode: address.state,
                    postalCode: address.zip,
                    countryCode: address.country,
                },
              "contact": {
                "personName": address.name,
                "emailAddress": address.email,
                "phoneNumber": address.phoneNumber? address.phoneNumber: "0000000000",
              },
            }
          ],
          "pickupType": "USE_SCHEDULED_PICKUP",
          "serviceType": serviceType,
          "packagingType": packaging,
          "totalWeight": weight,
          "shippingChargesPayment": {
            "paymentType": "SENDER",
          },
          "blockInsightVisibility": true,
          "preferredCurrency": "USD",
          "totalPackageCount": 1,
          "shipmentSpecialServices": {
            "specialServiceTypes": [
            "FEDEX_ONE_RATE"
            ]
            },
          "requestedPackageLineItems": [
            {
              "weight": {
                "units": "LB",
                "value": weight
              },
              "dimensions": {
                "length": 10,
                "width": 8,
                "height": 2,
                "units": "IN"
            },
            }
          ],
          "labelSpecification": {
            "labelStockType": "STOCK_4X8",
            "imageType": "ZPLII",
          },
        },
        "labelResponseOptions": "LABEL",
        "accountNumber": {
          "value":  process.env.AccountFedExTest
        },
        "shipAction": "CONFIRM",
        "processingOptionType": "SYNCHRONOUS_ONLY",
        "oneLabelAtATime": false
      }
      // if(serviceType == "SMART_POST"){
      //     body.smartPostDetail = {
      //         ancillaryEndorsement: "CARRIER_LEAVE_IF_NO_RESPONSE",
      //         hubId: 5531,
      //         "indicia": "MEDIA_MAIL",
      //         specialServices: "USPS_DELIVERY_CONFIRMATION"
      //     }
      // }
      // if(!body.shipmentSpecialServices) body.shipmentSpecialServices = {}
      // if((packaging == "FEDEX_PAK" || packaging == "FEDEX_ENVELOPE") && serviceType == "FEDEX_2DAY" && saturdayDelivery){
      //     body.shipmentSpecialServices.specialServiceTypes = ["FEDEX_ONE_RATE", "SATURDAY_DELIVERY"]
      // }
      // else if((packaging == "FEDEX_PAK" || packaging == "FEDEX_ENVELOPE") && serviceType == "FEDEX_2DAY" && !saturdayDelivery){
      //     body.shipmentSpecialServices.specialServiceTypes = ["FEDEX_ONE_RATE"]
      // }else if(saturdayDelivery) body.shipmentSpecialServices.specialServiceTypes = ["SATURDAY_DELIVERY"]
      let options = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-locale": "en_US"
        }
    }
    let send = await axios.post("https://apis-sandbox.fedex.com/ship/v1/shipments", body, options).catch(e=>{console.log(e.response.data)})
    console.log(send? send.data.output: "error")
    console.log(send? send.data.output.transactionShipments[0]: "error")
    console.log(send? send.data.output.transactionShipments[0].pieceResponses: "error")
    console.log(send? send.data.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].encodedLabel: "error")
    let result = {trackingNumber: send.data.output.transactionShipments[0].pieceResponses[0].masterTrackingNumber, label: new Buffer.from(send.data.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].encodedLabel, "base64").toString('ascii'), cost: send.data.output.transactionShipments[0].pieceResponses[0].baseRateAmount}
    console.log(result)
    return result
    //console.log(send.data.output.transactionShipments[0].completedShipmentDetail.completedPackageDetails)
    //console.log(send.data.output.transactionShipments[0].completedShipmentDetail)
}