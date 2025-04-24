import axios from "axios"
// get next available gtin

export async function NextGTIN({auth}){
    let headers = {
        headers:{
            "Cache-Control": "no-cache",
            ApiKey: auth.apiKey,
            "X-Product-Owner-Account-Id": auth.accountNumber
        }
    }
    let resPre = await axios.get("https://api.gs1us.org/api/v1/myprefix", headers).catch(e=>{console.log(e.response.data)})
    while(!resPre){
        await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve()
            },1000)
        })
        resPre = await axios.get("https://api.gs1us.org/api/v1/myprefix", headers).catch(e=>{console.log(e.response.data)})
    }
    //console.log(resPre?.data)
    let prefix = resPre?.data.filter(p=> p.remainingCapacity > 0)[0]
    //console.log(prefix.prefix)
    if(prefix){
        let resNext = await axios.get(`https://api.gs1us.org/api/v1/myprefix/${prefix.prefix}/gtin/next`, headers).catch(e=>{console.log(e.response?.data)})
        while(!resNext){
            await new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve()
                },1000)
            })
            resNext = await axios.get(`https://api.gs1us.org/api/v1/myprefix/${prefix.prefix}/gtin/next`, headers).catch(e=>{console.log(e.response?.data)})
        }
        //console.log(resNext?.data)
        if(resNext?.data && resNext.data.gtin) return resNext.data
    }
    return null
}

export async function CreateUpdateUPC({auth, body}){
    let headers = {
        headers:{
            "Cache-Control": "no-cache",
            ApiKey: auth.apiKey,
            "X-Product-Owner-Account-Id": auth.accountNumber
        }
    }
    let res = await axios.post(`https://api.gs1us.org/api/v1/myproduct/${body.gtin}`, body, headers).catch(e=>{console.log(e.response?.data)})
    return {error: res?.data?.product == undefined, product: res?.data?.product}
}

export async function GetUpc({gtin}){
    let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${gtin}`, headers).catch(e=> console.log(e.response?.data))
    return res?.data
}
