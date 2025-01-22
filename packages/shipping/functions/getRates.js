import {getRatesEn} from "./usps/endicia";
import {getRatesUSPS} from "./usps/usps";
//import {getRatesFe} from "./fedex"
//import {getRatesUPS} from "./ups"

let standardType = {
    fistClass: "usps",
    priority: "usps",
    smartPost: "fedex",
    fedexGround: "fedex",
    upsGround: "ups"
}

export async function getRates({type, address, weight, businessAddress, providers, enSettings, credentials}){
    if(type.toLowerCase() == "standard"){
        let uspsGroundRate
        let uspsPriorityRate
        let FedExSmartPost
        let FedExHomeRate
        let upsGroundRate
        if(providers.includes("endicia")){
            let res = await getRatesEn({address, weight, businessAddress, service: "GroundAdvantage", enSettings})
            if(!res.error) uspsGroundRate = parseFloat(res.rate)
            else uspsGroundRate = res.msg
            let res2 = await getRatesEn({address, weight, businessAddress, service: "Priority", enSettings})
            if(!res2.error) uspsPriorityRate = parseFloat(res2.rate)
            else uspsPriorityRate = res2.msg
        }
        if(providers.includes("usps")){
            let res = await getRatesUSPS({address, weight, businessAddress, service: "USPS_GROUND_ADVANTAGE", credentials, dimensions: {length: 11, width: 8, height: .25}})
            if(!res.error) uspsGroundRate = parseFloat(res.rate)
            else uspsGroundRate = res.msg
            let res2 = await getRatesUSPS({address, weight, businessAddress, service: "PRIORITY_MAIL", credentials, dimensions: {length: 11, width: 8, height: .25}})
            if(!res2.error) uspsPriorityRate = parseFloat(res2.rate)
            else uspsPriorityRate = res2.msg
        }
        return {error: false, rates: [{label: "USPS Ground Advantage", rate: uspsGroundRate}, {label: "USPS Priority Mail",rate:uspsPriorityRate}, {label: "FedEx Smart Post", rate: FedExSmartPost}, {label: "FedEx Home", rate:FedExHomeRate}, {label: "UPS Ground", rate: upsGroundRate}] }
    }else if(type.toLowerCase() == "expedited"){

    }else if(type.toLowerCase() == "second day"){

    }else if(type.toLowerCase() == "next day"){
        
    }
}