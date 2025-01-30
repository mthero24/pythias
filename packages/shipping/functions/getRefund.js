import {requestRefund} from "./usps/endicia"
import {refund} from "./usps/usps";
export async function getRefund({PIC, enSettings, credentials, providers}){
    if(providers.includes("endicia")){
        let res = await requestRefund({PIC, enSettings})
        return res
    }
    if(providers.includes("usps")){
        let res = await refund({trackingNumber: PIC, credentials})
        return res
    }
}