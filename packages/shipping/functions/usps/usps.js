import axios from "axios"
import fs from "fs"
async function GetToken({credentials}){
    console.log(credentials)
    let res = await axios.post(`https://${credentials.api? credentials.api: "api"}.usps.com/oauth2/v3/token`, {
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: "addresses international-prices subscriptions payments pickup tracking labels scan-forms companies service-delivery-standards locations international-labels prices",
        code: "sdafae",
    }).catch(e=>{console.log(e.response.data, "why")})
    //console.log(res?.data)
    if(res && res.data.access_token){
        return res.data.access_token
    }
    else return null
}

export async function TrackPackage({tn, credentials}){
    let token = await GetToken({credentials})
    //console.log(token)
    if(token){
        let headers = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        let res = await axios.get(`https://${credentials.api? credentials.api: "api"}.usps.com/tracking/v3/tracking/${tn}`, headers).catch(e=>{
            //console.log(e.response.data)
        })
        //console.log(res?.data)
        if(res && res.data && res.data.eventSummaries) return res.data.eventSummaries
    }
    return []
}

export async function GenerateManifest({PicNumbers, credentials, businessAddress}){
   // console.log("Gen Man", PicNumbers)
    let token = await GetToken({credentials})
    //console.log(token)
    if(token){
        let headers = {
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept": "application/vnd.usps.labels+json"
            }
        }
        let resData
        let res = await axios.post(`https://${credentials.api? credentials.api: "api"}.usps.com/scan-forms/v3/scan-form`, {
            form: "5630",
            imageType: "JPG",
            labelType: "8.5x11LABEL",
            mailingDate: `${new Date(Date.now()).getFullYear()}-${(new Date(Date.now()).getMonth() + 1).toString().length > 1? (new Date(Date.now()).getMonth() + 1).toString(): `0${(new Date(Date.now()).getMonth() + 1).toString()}`}-${new Date(Date.now()).getDate().toString().length > 1? new Date(Date.now()).getDate().toString(): `0${new Date(Date.now()).getDate().toString()}`}`,
            overwriteMailingDate: true,
            entryFacilityZIPCode: businessAddress.postalCode,
            destinationEntryFacilityType: "NONE",
            shipment: {
                trackingNumbers: PicNumbers
            },
            fromAddress: {
                streetAddress: businessAddress.addressLine1,
                secondaryAddress: businessAddress.addressLine2,
                city: businessAddress.city,
                state: businessAddress.state,
                ZIPCode: businessAddress.postalCode,
                firstName: businessAddress.name.split(" ")[0],
                lastName: businessAddress.name.split(" ")[1],
                firm: businessAddress.companyName
            },
            "ignoreBadAddress": true
        }, headers).catch(e=>{console.log(e.response);resData= e.response.data})
        console.log(res?.data, resData?.error?.errors)
        if(res?.data.error) {
            return {error:true, msg: res.data.message}
        }
        else if(resData)return {error:true, msg: resData.error.message}
        else return {error:false, manifest: res.data.SCANFormImage}
    }
    return {error: true, msg: "failed credentials"}
}

export async function getRatesUSPS({address, weight, dimensions, businessAddress, credentials, service}){
    let token = await GetToken({credentials})
    let data = {
        "originZIPCode": businessAddress.postalCode,
        "destinationZIPCode": address.zip,
        "weight": weight / 16,
        "length": dimensions.length? dimensions.length: 11,
        "width": dimensions.width? dimensions.width: 8,
        "height": dimensions.height? dimensions.height: .25,
        "mailClass": service,
        "processingCategory": "NONSTANDARD",
        "rateIndicator": "SP",
        "destinationEntryFacilityType": "NONE",
        "priceType": "CONTRACT",
        "mailingDate": `${new Date(Date.now()).getFullYear()}-${(new Date(Date.now()).getMonth() + 1).toString().length > 1? (new Date(Date.now()).getMonth() + 1).toString() : `0${(new Date(Date.now()).getMonth() + 1).toString()}`}-${(new Date(Date.now()).getDate()).toString().length > 1? (new Date(Date.now()).getDate()).toString(): `0${(new Date(Date.now()).getDate()).toString()}`}`,
        "accountType": "EPS",
        "accountNumber": credentials.accountNumber
    }
    console.log(data)
    //await fs.writeFileSync('data.txt', JSON.stringify(data), 'utf8');
    if(token){
        let headers = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        let resData
        let res = await axios.post(`https://${credentials.api? credentials.api: "api"}.usps.com/prices/v3/base-rates/search`, data, headers).catch(e=>{resData= e.response.data})
        console.log(res?.data, resData)
        console.log(resData? resData.error: "")
        if(res?.data.error) {
            //await fs.writeFileSync('data2.txt', JSON.stringify(res.data), 'utf8');
            console.log(res.data.errors)
            return {error:true, msg: res.data.message}
        }
        else if(resData){
            //await fs.writeFileSync('data2.txt', JSON.stringify(resData), 'utf8');
            return {error:true, msg: resData.error.message} 
        }
        else return {error:false, rate: res.data.totalBasePrice}
    }else{
        return {error: true, msg: "No Token Returned"}
    }
}
const paymentAuth = async ({token, credentials})=>{
    let data = {roles: [{roleName: "LABEL_OWNER", CRID: credentials.crid, MID: credentials.mid, manifestMID: credentials.manifestMID}, {roleName: "PAYER", "accountType": "EPS", CRID: credentials.crid, accountNumber: credentials.accountNumber}, {
        "roleName": "RATE_HOLDER",
        "CRID": credentials.crid,
        "accountType": "EPS",
        "accountNumber": credentials.accountNumber
        }]}
    let headers = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
    let resData
    let res = await axios.post(`https://${credentials.api? credentials.api: "api"}.usps.com/payments/v3/payment-authorization`, data, headers).catch(e=>{resData= e.response.data})
    console.log(res?.data, "res.data", resData, "resData")
    if(res?.data.paymentAuthorizationToken){
        return {error: false, paymentAuth: res?.data.paymentAuthorizationToken}
    }else if(resData){
        return {error: true, msg: "problem with payment auth"}
    }else{
        return {error: true, msg: "something went wrong"}
    }
}
export async function purchaseLabel({address, weight, dimensions, businessAddress, credentials, selectedShipping, dpi, ignoreBadAddress, items, imageFormat}){
    //console.log(credentials)
    let customsForm
    if(address.state == "AP" || address.state == "AA" || address.state == "AE"){
        
        customsForm = {
            AESITN: "NO EEI 30.37(a)",
            customsContentType: "MERCHANDISE",
            contents: items
        }
    }
    console.log("cutoms", customsForm)
    console.log(address)
    let token = await GetToken({credentials})
    let data = {
        imageInfo: {
            imageType:imageFormat? imageFormat: dpi? "ZPL300DPI": "ZPL203DPI",
            receiptOption: "NONE"
        },
        "toAddress": {
          "firstName": address.name.trim().split(" ")[0],
          "lastName": address.name.trim().split(" ").slice(address.name.trim().split(" ").length - 1).toString(),
          "streetAddress": address.address1,
          "secondaryAddress": address.address2,
          "city": address.city,
          "state": address.state,
          "ZIPCode": address.zip.split("-")[0],
          "ignoreBadAddress": ignoreBadAddress
        },
        "fromAddress": {
          "firstName": businessAddress.name.split(" ")[0],
          "lastName": businessAddress.companyName? businessAddress.companyName: businessAddress.name.split(" ")[1],
          "streetAddress": businessAddress.address1? businessAddress.address1: businessAddress.addressLine1,
          "secondaryAddress": businessAddress.address2? businessAddress.address2: businessAddress.addressLine2,
          "city": businessAddress.city,
          "state": businessAddress.state,
          "ZIPCode": businessAddress.zip? businessAddress.zip: businessAddress.postalCode
        },
        "packageDescription": {
          "mailClass": selectedShipping.name,
          "rateIndicator": "SP",
          "weightUOM": "lb",
          "weight": (weight / 16),
          "dimensionsUOM": "in",
          "length": dimensions.length,
          "height": dimensions.height,
          "width": dimensions.width,
          "processingCategory": "NONSTANDARD",
          "mailingDate": `${new Date(Date.now()).getFullYear()}-${(new Date(Date.now()).getMonth() + 1).toString().length > 1? (new Date(Date.now()).getMonth() + 1).toString() : `0${(new Date(Date.now()).getMonth() + 1).toString()}`}-${(new Date(Date.now()).getDate()).toString().length > 1? (new Date(Date.now()).getDate()).toString(): `0${(new Date(Date.now()).getDate()).toString()}`}`,
          "extraServices": [],
          "destinationEntryFacilityType": "NONE"
        },
        customsForm
    }
    console.log(data)
    if(token){
        let paymentAutho = await paymentAuth({token, credentials})
        console.log(paymentAutho, "payment auth")
        if(!paymentAutho.error){
            let headers = {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Payment-Authorization-Token": paymentAutho.paymentAuth,
                    "Accept": "application/vnd.usps.labels+json"
                }
            }
            let resData
            let res = await axios.post(`https://${credentials.api? credentials.api: "api"}.usps.com/labels/v3/label`, data, headers).catch(e=>{resData= e.response.data})
            if(res?.data.error){
                console.log("res.data")
                return {error:true, msg: res.data.message}
            }
            else if(resData){
                console.log(resData, "resData")
                return {error:true, msg: `${resData.error.message} - ${resData?.error.errors[0]?.detail} - ${resData?.error.errors[0]?.source.parameter}`}
            }
            else return {error:false, label: imageType == "PDF"? res.data.labelImage.replace("data:application/pdf;base64,", "") :res.data.labelImage, trackingNumber: res.data.trackingNumber, cost: res.data.postage}
        }
        else return paymentAutho
    }else {
        console.log("no token")
    }
}
export const refund = async ({trackingNumber, credentials})=>{
    let token = await GetToken({credentials})
    if(token){
        let paymentAutho = await paymentAuth({token, credentials})
        console.log(paymentAutho, "payment auth")
        if(!paymentAutho.error){
            let headers = {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Payment-Authorization-Token": paymentAutho.paymentAuth,
                    "Accept": "application/json"
                }
                }
            let resData
            console.log(trackingNumber)
            let res = await axios.delete(`https://${credentials.api? credentials.api: "api"}.usps.com/labels/v3/label/${trackingNumber}`, headers).catch(e=>{resData= e.response.data})
            console.log(res?.data, resData)
            if(res?.data.error){
                return {error: true, msg: "error from usps"}
            }else if(resData){
                console.log(resData.error.errors)
                return {error:true, msg: `${resData.error.message} - ${resData?.error.errors[0]?.detail} - ${resData?.error.errors[0]?.source.parameter}`}
            }
            else return {error: false, msg: res.data.status}
        }else return {error: true, msg: "no payment token received"}
    }else return {error: true, msg: "no token received"}

}   
export const checkAddress = async ({address, credentials})=>{
    let token = await GetToken({credentials})
    if(token){
       
        let headers = {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
            }
        let resData
        let res = await axios.get(`https://${credentials.api? credentials.api: "api"}.usps.com/addresses/v3/address?streetAddress=${address.address1}&secondaryAddress=${address.apt}&city=${address.city}&state=${address.state}&ZIPCode=${address.zip}`, headers).catch(e=>{resData= e.response.data})
        console.log(res?.data, resData)
        if(res?.data.error){
            return {error: true, msg: "error from usps"}
        }else if(resData){
            return {error:true, msg: `${resData.error.message} - ${resData?.error.errors[0]?.detail} - ${resData?.error.errors[0]?.source.parameter}`}
        }
        else return {error: false, msg: res.data.status}
    }else return {error: true, msg: "no token received"}

}   