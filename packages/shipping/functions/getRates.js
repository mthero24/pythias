import {getRatesEn} from "./usps/endicia";
import {getRatesUSPS} from "./usps/usps";
import {getRatesFeOld} from "./fedex/old";
import { getRatesFeNew } from "./fedex/new";
import {getRatesUPS} from "./ups";
import { GetRateShipStation } from "./shipstatiton";
let standardType = {
    fistClass: "usps",
    priority: "usps",
    smartPost: "fedex",
    fedexGround: "fedex",
    upsGround: "ups"
}

export async function getRates({
  type,
  address,
  weight,
  businessAddress,
  providers,
  enSettings,
  credentials,
  credentialsFedEx,
  credentialsFedExNew,
  credentialsUPS,
  credentialsShipStation,
  dimensions
}) {
  let rates =[];
  let uspsGroundRate;
  let uspsPriorityRate;
  let FedExSmartPost;
  let FedExHomeRate;
  let upsGroundRate;
  console.log(type, "++++++++++++ shipping type ++++++++++++++++++")
  if (type.toLowerCase() == "standard") {
    if (providers.includes("endicia")) {
      console.log("here")
      let res = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "GroundAdvantage",
        enSettings,
        dimensions
      });
      console.log(res.error)
      if (!res.error) uspsGroundRate = parseFloat(res.rate);
      else uspsGroundRate = res.msg;
      let res2 = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "Priority",
        enSettings,
        dimensions
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Ground Advantage", rate: uspsGroundRate, service: {provider: "usps", name: "GroundAdvantage"} })
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate, service:{provider: "usps",name: "Priority" }})
    }
    if (providers.includes("usps")) {
      let res = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "USPS_GROUND_ADVANTAGE",
        credentials,
        dimensions,
      });
      if (!res.error) uspsGroundRate = parseFloat(res.rate);
      else uspsGroundRate = res.msg;
      let res2 = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "Priority",
        credentials,
        dimensions,
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Ground Advantage", rate: uspsGroundRate, service: {provider: "usps", name: "USPS_GROUND_ADVANTAGE"} })
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate, service: {provider: "usps", name: "PRIORITY_MAIL"} })
    }
    if(providers.includes("shipstation")){
      let res = await GetRateShipStation({
        address,
        weight,
        businessAddress,
        service: "usps_ground_advantage",
        credentials: credentialsShipStation,
        dimensions,
      });
      if (!res.error) uspsGroundRate = parseFloat(res.rate);
      else uspsGroundRate = res.msg;
      let res2 = await GetRateShipStation({
        address,
        weight,
        businessAddress,
        service: "usps_priority_mail",
        credentials: credentialsShipStation,
        dimensions,
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Ground Advantage", rate: uspsGroundRate, service: {provider: "usps", name: "usps_ground_advantage"} })
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate, service: {provider: "usps", name: "usps_priority_mail"} })
    }
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "SMART_POST", service: "PRESORTED_STANDARD", packaging: "YOUR_PACKAGING", dimensions});
      if(res.error) FedExSmartPost = res.msg
      else FedExSmartPost = res.rate;
      let res2 = await getRatesFeOld({
        credentials: credentialsFedEx,
        weight: weight / 16,
        address,
        businessAddress,
        serviceType: "GROUND_HOME_DELIVERY",
        service: "PRESORTED_STANDARD",
        packaging: "YOUR_PACKAGING",
        dimensions
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx Smart Post", rate: FedExSmartPost, service: { provider: "fedex", name: "SMART_POST", service: "PRESORTED_STANDARD", packaging: "YOUR_PACKAGING"} });
      rates.push({ label: "FedEx Home", rate: FedExHomeRate, service: {provider: "fedex", name: "GROUND_HOME_DELIVERY", service: "PRESORTED_STANDARD", packaging: "YOUR_PACKAGING"} })
    }
    if(providers.includes("ups")){
      let res = await getRatesUPS({address, businessAddress, service: "03", description: "Ground", packageType: "02", packageDescription: 'Package', weight, credentials: credentialsUPS})
      console.log(res)
      rates.push({ label: "UPS Ground", rate: res, service: {provider: "ups", name: "Ground", service: "03", description: "Ground", packageType: "02", packageDescription: 'Package'} })
    }
  } else if (type.toLowerCase() == "expedited") {
    if (providers.includes("endicia")) {
      let res2 = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "Priority",
        enSettings,
        dimensions
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate, service:{provider: "usps", name: "Priority" } })
    }
    if (providers.includes("usps")) {
      let res2 = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "PRIORITY_MAIL",
        credentials,
        dimensions,
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate, service: {provider: "usps", name: "PRIORITY_MAIL"} })
    }
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging: "FEDEX_ENVELOPE", dimensions});
      if(res.error) FedExSmartPost = res.msg
      else FedExSmartPost = res.rate;
      let res2 = await getRatesFeOld({
        credentials: credentialsFedEx,
        weight: weight / 16,
        address,
        businessAddress,
        serviceType: "GROUND_HOME_DELIVERY",
        service: "PRESORTED_STANDARD",
        packaging: "YOUR_PACKAGING",
        dimensions
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx Second Day", rate: FedExSmartPost, service: {provider: "fedex", name: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging:  dimensions.packaging} });
      rates.push({ label: "FedEx Home", rate: FedExHomeRate, service: {provider: "fedex", name: "GROUND_HOME_DELIVERY", service: "PRESORTED_STANDARD", packaging: "YOUR_PACKAGING"} })
    }
    if(providers.includes("ups")){
      let res = await getRatesUPS({address, businessAddress, service: "03", description: "Ground", packageType: "02", packageDescription: 'Package', weight, credentials: credentialsUPS})
      console.log(res)
      rates.push({ label: "UPS Ground", rate: res, service: {provider: "ups", name: "Ground", service: "03", description: "Ground", packageType: "02", packageDescription: 'Package'} })
    }
  } else if (type.toLowerCase() == "second day") {
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging:  dimensions.packaging, dimensions});
      if(res.error) FedExSmartPost = res.msg
      else FedExSmartPost = res.rate;
      //console.log(res)
      rates.push({ label: "FedEx Second Day", rate: FedExSmartPost, service: {provider: "fedex", name: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging:  dimensions.packaging} });
    }
  } else if (type.toLowerCase() == "next day") {
    if (providers.includes("fedex")) {
      let name = "STANDARD_OVERNIGHT"
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "STANDARD_OVERNIGHT", service: "PARCEL_SELECT", packaging:  dimensions.packaging, dimensions});
      if(res.error) {
        //if(res.msg == "STANDARD_OVERNIGHT is not supported for the destination."){
          res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "PRIORITY_OVERNIGHT", service: "PARCEL_SELECT", packaging:  dimensions.packaging, dimensions});
          if(res.error) {
            FedExSmartPost = res.msg
          }
          else{
            FedExSmartPost = res.rate;
            name="PRIORITY_OVERNIGHT"
          }
        // }else {
        //   FedExSmartPost = res.rate;
        // }
      }
      else {
        FedExSmartPost = res.rate;
        console.log(res)
      }
      console.log({ label: "FedEx Next Day", rate: FedExSmartPost, service: {provider: "fedex", name, service: "PARCEL_SELECT", packaging: dimensions.packaging} })
        rates.push({ label: "FedEx Next Day", rate: FedExSmartPost, service: {provider: "fedex", name, service: "PARCEL_SELECT", packaging: dimensions.packaging} });
    }
  }
  return {
    error: false,
    rates
  };
}