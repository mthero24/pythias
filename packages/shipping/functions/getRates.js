import {getRatesEn} from "./usps/endicia";
import {getRatesUSPS} from "./usps/usps";
import {getRatesFeOld} from "./fedex/old";
import { getRatesFeNew } from "./fedex/new";
import {getRatesUPS} from "./ups";

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
  credentialsUPS
}) {
  let rates =[];
  let uspsGroundRate;
  let uspsPriorityRate;
  let FedExSmartPost;
  let FedExHomeRate;
  let upsGroundRate;
  if (type.toLowerCase() == "standard") {
    if (providers.includes("endicia")) {
      let res = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "GroundAdvantage",
        enSettings,
      });
      if (!res.error) uspsGroundRate = parseFloat(res.rate);
      else uspsGroundRate = res.msg;
      let res2 = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "Priority",
        enSettings,
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate })
    }
    if (providers.includes("usps")) {
      let res = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "USPS_GROUND_ADVANTAGE",
        credentials,
        dimensions: { length: 11, width: 8, height: 0.25 },
      });
      if (!res.error) uspsGroundRate = parseFloat(res.rate);
      else uspsGroundRate = res.msg;
      let res2 = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "PRIORITY_MAIL",
        credentials,
        dimensions: { length: 11, width: 8, height: 0.25 },
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate })
    }
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "SMART_POST", service: "PRESORTED_STANDARD", packaging: "YOUR_PACKAGING"});
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
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx Smart Post", rate: FedExSmartPost });
      rates.push({ label: "FedEx Home", rate: FedExHomeRate })
    }
    if(providers.includes("ups")){
      let res = await getRatesUPS({address, businessAddress, service: "03", description: "Ground", packageType: "02", packageDescription: 'Package', weight, credentials: credentialsUPS})
      rates.push({ label: "UPS Ground", rate: upsGroundRate })
    }
  } else if (type.toLowerCase() == "expedited") {
    if (providers.includes("endicia")) {
      let res2 = await getRatesEn({
        address,
        weight,
        businessAddress,
        service: "Priority",
        enSettings,
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Ground Advantage", rate: uspsGroundRate })
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate })
    }
    if (providers.includes("usps")) {
      let res2 = await getRatesUSPS({
        address,
        weight,
        businessAddress,
        service: "PRIORITY_MAIL",
        credentials,
        dimensions: { length: 11, width: 8, height: 0.25 },
      });
      if (!res2.error) uspsPriorityRate = parseFloat(res2.rate);
      else uspsPriorityRate = res2.msg;
      rates.push({ label: "USPS Ground Advantage", rate: uspsGroundRate })
      rates.push({ label: "USPS Priority Mail", rate: uspsPriorityRate })
    }
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging: "FEDEX_ENVELOPE"});
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
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx 2nd Day", rate: FedExSmartPost });
      rates.push({ label: "FedEx Home", rate: FedExHomeRate })
    }
  } else if (type.toLowerCase() == "second day") {
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "FEDEX_2_DAY", service: "PARCEL_SELECT", packaging: "FEDEX_ENVELOPE"});
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
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx 2nd Day", rate: FedExSmartPost });
    }
  } else if (type.toLowerCase() == "next day") {
    if (providers.includes("fedex")) {
      let res = await getRatesFeOld({ credentials: credentialsFedEx, weight: weight / 16, address, businessAddress, serviceType: "STANDARD_OVERNIGHT", service: "PARCEL_SELECT", packaging: "FEDEX_ENVELOPE"});
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
      });
      if (res2.error) FedExHomeRate = res2.msg;
      else FedExHomeRate = res2.rate;
      //console.log(res)
      rates.push({ label: "FedEx Next Day", rate: FedExSmartPost });
    }
  }
  return {
    error: false,
    rates
  };
}