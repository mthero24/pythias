import {buyShippingLabelEn} from "./usps/endicia";
import { purchaseLabel } from "./usps/usps";
import {ship} from "./ups";
import {purchaseLabel as purchaseLabelFedEx} from "./fedex/old"
import { ShipStationShip } from "./shipstatiton";
export async function buyLabel({address, poNumber, weight, selectedShipping, dimensions, businessAddress, providers, enSettings,
    credentials,
    credentialsFedEx,
    credentialsFedExNew,
    credentialsShipStation,
    credentialsUPS, dpi, ignoreBadAddress, imageFormat, thirdParty, items, imageType}){
    if(selectedShipping.provider == "usps"){
        if(providers.includes("endicia")){
            let res = await buyShippingLabelEn({address, poNumber, weight, selectedShipping, dimensions, businessAddress, enSettings, dpi,imageFormat, items})
            return res
        }
        else if(providers.includes("usps")){
            let res = await purchaseLabel({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials, dpi, ignoreBadAddress: true, imageFormat, items, imageType })
            return res
        }else if(providers.includes("shipstation")){
            let res = await ShipStationShip({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials: credentialsShipStation, dpi, ignoreBadAddress, imageFormat, items })
            return res
        }else return {error: true, msg: "no usps provider selected please add endicia or usps to the providers array"}
    }else if(selectedShipping.provider == "fedex"){
        if(providers.includes("fedex")){
            let res = await purchaseLabelFedEx({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials: credentialsFedEx, saturdayDelivery: false, imageFormat})
            return res
        }else return {error: true, msg: "fedex is not in provider list"}
    }else if(selectedShipping.provider == "ups"){
        let res = await ship({address, poNumber, weight, selectedShipping, dimensions, businessAddress, credentials: credentialsUPS, thirdParty, imageFormat})
        return res
    }else{
        return {error: true, msg: "no provider selected or provider is invalid"}
    }
}