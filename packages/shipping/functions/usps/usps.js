import axios from "axios"
import manifest from "../../../../apps/base/models/manifest"

async function GetToken({credentials}){
    let res = await axios.post("https://api.usps.com/oauth2/v3/token", {
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: "addresses international-prices subscriptions payments pickup tracking labels scan-forms companies service-delivery-standards locations international-labels prices",
        code: "EyQPFYVI",
    }).catch(e=>{console.log(e.response.data)})
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
        let res = await axios.get(`https://api.usps.com/tracking/v3/tracking/${tn}`, headers).catch(e=>{
            console.log(e.response.data)
        })
        //console.log(res?.data)
        if(res && res.data && res.data.eventSummaries) return res.data.eventSummaries
    }
    return []
}

export async function GenerateManifest({PicNumbers, credentials, businessAddress}){
    console.log("Gen Man", PicNumbers)
    let token = await GetToken({credentials})
    console.log(token)
    if(token){
        let headers = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        let resData
        let res = await axios.post("https://api.usps.com/scan-forms/v3/scan-form", {
            form: "5630",
            imageType: "JPG",
            labelType: "8.5x11LABEL",
            mailingDate: `${new Date(Date.now()).getFullYear()}-${(new Date(Date.now()).getMonth() + 1).toString().length > 1? (new Date(Date.now()).getMonth() + 1).toString(): `0${(new Date(Date.now()).getMonth() + 1).toString()}`}-${new Date(Date.now()).getDate().toString().length > 1? new Date(Date.now()).getDate().toString(): `0${new Date(Date.now()).getDate().toString()}`}`,
            overwriteMailingDate: false,
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
        console.log(res?.data, resData)
        if(res?.data.error) return {error:true, msg: res.data.message}
        else if(resData)return {error:true, msg: resData.error.message}
        else return {error:false, manifest: res.data.SCANFormImage}
    }
    return {error: true, msg: "failed credentials"}
}