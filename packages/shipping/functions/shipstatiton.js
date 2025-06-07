import axios from "axios"
let carrierCodes ={
    usps: "se-1652813",
    ups: "se-801899"
}
let serviceCodes ={
    usps:{
        GroundAdvantage: "usps_ground_advantage",
        Priority: "usps_priority_mail"
    },
}
export async function getCarriers({credentials}){
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "api-key": credentials.apiKey
        }
    }
    let errorRes
    let res = await axios.get(`https://api.shipstation.com/v2/labels`, headers).catch((err)=>{
        //console.log(err.response.data)
        errorRes = err.response.data
    })
    console.log(res?.data, errorRes)
    if(errorRes){
        console.log("here")
        return {error: true, msg: errorRes.errors[0].message}
    }else{
        
        return 
    }
}

export async function ShipStationShip({address, poNumber, weight, businessAddress, credentials, selectedShipping, dimensions, dpi, ignoreBadAddress, carrierCodes,
  warehouse_id}){
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "api-key": credentials.apiKey
        }
    }

    let data = {
        ship_to_service_point_id: '614940',
        ship_from_service_point_id: '614940',
        shipment: {
            carrier_id: carrierCodes[selectedShipping.provider],
            service_code: selectedShipping.name,
            external_order_id: poNumber,
            ship_date:  `${new Date(Date.now()).getFullYear()}-${(new Date(Date.now()).getMonth() + 1).toString().length > 1? (new Date(Date.now()).getMonth() + 1).toString() : `0${(new Date(Date.now()).getMonth() + 1).toString()}`}-${(new Date(Date.now()).getDate()).toString().length > 1? (new Date(Date.now()).getDate()).toString(): `0${(new Date(Date.now()).getDate()).toString()}`}`,
            ship_to: {
            name: address.name,
            phone: address.phoneNumber? address.phoneNumber: "0000000000",
            address_line1: address.address1,
            address_line2: address.address2,
            city_locality: address.city,
            state_province: address.state,
            postal_code: address?.zip?.split("-")[0],
            country_code: address.country,
            address_residential_indicator: 'unknown',
            },
            warehouse_id: warehouse_id,
            return_to: {
                name: businessAddress.name,
                phone: businessAddress.phoneNumber? businessAddress.phoneNumber: "0000000000",
                email: businessAddress.email,
                company_name: businessAddress.companyName,
                address_line1: businessAddress.addressLine1,
                address_line2: businessAddress.addressLine2,
                city_locality: businessAddress.city,
                state_province: businessAddress.state,
                postal_code: businessAddress.postalCode,
                country_code: businessAddress.country,
                address_residential_indicator: 'no',
                instructions: 'any instructions'
            },
            is_return: false,
            confirmation: 'none',
            customs: {
                contents: "merchandise",
                non_delivery: "return_to_sender"
            },
            advanced_options: {
            
            },
            insurance_provider: 'none',
            packages: [
                {
                    package_code: 'package',
                    weight: {
                        value: weight,
                        unit: 'ounce'
                    },
                    dimensions: {
                    unit: 'inch',
                        length: dimensions.length,
                        width: dimensions.width,
                        height: dimensions.height
                    },
                    label_messages: {
                        reference1: poNumber,
                    },
                }
            ],
            comparison_rate_type: 'retail'
        },
        is_return_label: false,
        validate_address: ignoreBadAddress? 'no_validation': "validate_and_clean",
        label_download_type: 'inLine',
        label_format: dpi? "ZPL": 'pdf',
        display_scheme: 'label',
        label_layout: '4x6',
    }
    console.log(headers)
    let errorRes
    let res = await axios.post(`https://api.shipstation.com/v2/labels`, data, headers).catch((err)=>{
        //console.log(err.response.data)
        errorRes = err.response.data
    })
    console.log(res?.data, errorRes)
    if(errorRes){
        console.log("here")
        return {error: true, msg: errorRes.errors[0].message}
    }else{
        let result = {trackingNumber: res.data.tracking_number, label: res.data.label_download.href.replace("data:application/pdf;base64,", ""), cost: res.data.shipment_cost.amount}
        return result 
    }
}

export async function GetRateShipStation({address, weight, dimensions, service, businessAddress, credentials,carrierCodes,
  warehouse_id}){
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "api-key": credentials.apiKey
        }
    }
    let data = {
        carrier_id: carrierCodes["usps"],
        from_country_code: businessAddress.country,
        from_postal_code: businessAddress.postalCode,
        from_city_locality: businessAddress.city,
        from_state_province: businessAddress.state,
        to_country_code: address.country,
        to_postal_code: address.zip,
        to_city_locality: address.city,
        to_state_province: address.state,
        weight: {value: weight, unit: 'ounce'},
        dimensions: {
          unit: 'inch',
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height
        },
        confirmation: 'none',
        address_residential_indicator: 'unknown',
        ship_date: new Date(Date.now())
    }
    let errorRes
    let res = await axios.post("https://api.shipstation.com/v2/rates/estimate", data, headers).catch(e=>{
        console.log(e.response.data)
        errorRes = e.response.data
    })
    console.log(res?.data.filter(d=> d.service_code == service && d.package_type == "package"), errorRes)
    if(errorRes){
        console.log("here")
        return {error: true, msg: errorRes.errors[0].message}
    }else{
        let serve = res?.data.filter(d=> d.service_code == service && d.package_type == "package")[0]
        let result = {error: false, rate: serve.shipping_amount.amount}
        return result 
    }
}