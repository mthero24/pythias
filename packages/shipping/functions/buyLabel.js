import {buyShippingLabelEn} from "./usps/endicia";
import { purchaseLabel } from "./usps/usps";
import {purchaseLabel as purchaseLabelFedEx} from "./fedex/old"
export async function buyLabel({address, poNumber, weight, selectedShipping, dimensions, businessAddress, providers, enSettings,
    credentials,
    credentialsFedEx,
    credentialsFedExNew,
    credentialsUPS, dpi}){
    if(selectedShipping.provider == "usps"){
        if(providers.includes("endicia")){
            let res = await buyShippingLabelEn({address, poNumber, weight, selectedShipping, dimensions, businessAddress, enSettings, dpi})
            return res
        }
        else if(providers.includes("usps")){
            let res = await purchaseLabel({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials, dpi})
            return res
        }else return {error: true, msg: "no usps provider selected please add endicia or usps to the providers array"}
    }else if(selectedShipping.provider == "fedex"){
        if(providers.includes("fedex")){
            let res = await purchaseLabelFedEx({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials: credentialsFedEx, saturdayDelivery: false})
            return res
        }else return {error: true, msg: "fedex is not in provider list"}
    }else if(selectedShipping.provider == "ups"){

    }else{
        return {error: true, msg: "no provider selected or provider is invalid"}
    }
}